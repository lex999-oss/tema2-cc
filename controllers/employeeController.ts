import * as mongoose from 'mongoose';
import { Employee } from '../models/employee';
import * as helpers from '../common/helper';

class EmployeeController {
    // GET /employee
    async index(req: Request, res: Promise<JSON>) {
        try {
            const selectParams = {
                _id: 1,
                name: 1,
                email: 1
            };

            const employees = await Employee.getAll({}, selectParams);

            return helpers.success(res, employees);
        }
        catch (error) {
            return helpers.error(res, error);
        }
    }

    // POST /employee
    async create(req: Request, res: Promise<JSON>, param: any, postData: any) {
        postData = JSON.parse(postData);
        if (postData.length > 1) {
            postData.forEach(async element => {
                try {
                    var { name, email, isManager = false, managerId = null, peers = [] } = element;

                    var manageExists = await this.validateManager(managerId);

                    if (!manageExists) {
                        return;
                    }

                    if (managerId !== null) {
                        managerId = mongoose.Types.ObjectId(managerId);
                    }

                    if (!(peers instanceof Array)) {
                        peers = [peers];
                    }

                    var peersExists = await this.validatePeers(peers, isManager);

                    if (!peersExists) {
                        return;
                    }

                    if (peers.length > 0) {
                        peers = peers.map((el) => { return mongoose.Types.ObjectId(el); });
                    }

                    const employee: any = await Employee.create({ name, email, isManager, managerId, peers });

                    // set managerId of all peers
                    if (employee.peers.length > 0) {
                        const update = { $set: { managerId: mongoose.Types.ObjectId(employee._id) } };
                        await Employee.update({ _id: { $in: employee.peers } }, update, { multi: true });
                    }

                    return helpers.success(res, "Users added");
                }
                catch (error) {
                    if (error.name === 'ValidationError') {
                        return helpers.validationError(res, error);
                    }
                    else if (error.message.indexOf('duplicate key error') !== -1) {
                        return helpers.validationError(res, 'Email(s) already exists');
                    }
                    else {
                        console.log(error);
                        return helpers.error(res);
                    }
                }
            });

        }
        else {
            try {
                var { name, email, isManager = false, managerId = null, peers = [] } = postData;

                var manageExists = await this.validateManager(managerId);

                if (!manageExists) {
                    return helpers.validationError(res, 'ManagerId is invalid');
                }

                if (managerId !== null) {
                    managerId = mongoose.Types.ObjectId(managerId);
                }

                if (!(peers instanceof Array)) {
                    peers = [peers];
                }

                var peersExists = await this.validatePeers(peers, isManager);

                if (!peersExists) {
                    return helpers.validationError(res, 'Peer(s) is invalid');
                }

                if (peers.length > 0) {
                    peers = peers.map((el) => { return mongoose.Types.ObjectId(el); });
                }

                const employee: any = await Employee.create({ name, email, isManager, managerId, peers });

                // set managerId of all peers
                if (employee.peers.length > 0) {
                    const update = { $set: { managerId: mongoose.Types.ObjectId(employee._id) } };
                    await Employee.update({ _id: { $in: employee.peers } }, update, { multi: true });
                }

                return helpers.success(res, employee);
            }
            catch (error) {
                if (error.name === 'ValidationError') {
                    return helpers.validationError(res, error);
                }
                else if (error.message.indexOf('duplicate key error') !== -1) {
                    return helpers.validationError(res, 'Email already exists');
                }
                else {
                    console.log(error);
                    return helpers.error(res);
                }
            }
        }
    }

    // GET /employee/:id
    async show(req, res, param) {
        try {
            const pipeline = [
                {
                    "$match": {
                        "_id": mongoose.Types.ObjectId(param)
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "isManager": 1,
                        "name": 1,
                        "email": 1,
                        "managerId": 1
                    }
                },
                {
                    "$lookup": {
                        "from": "employees",
                        "localField": "managerId",
                        "foreignField": "_id",
                        "as": "manager"
                    }
                }
            ];

            const employee = await Employee.aggregation(pipeline);

            return helpers.success(res, employee);
        }
        catch (error) {
            return helpers.error(res, error);
        }
    }

    // PUT /employee/:id
    async update(req, res, param, postData: any) {
        var employee;

        try {
            employee = await Employee.get({ _id: param }, { isManager: 1 });
        }
        catch (e) {
            console.log(e);
        }

        if (!employee) {
            return helpers.error(res, 'Entity not found', 404);
        }

        postData = JSON.parse(postData);

        var updateData: any = {
            isManager: employee.isManager
        };

        if (postData.name) {
            updateData.name = postData.name;
        }

        if (postData.email) {
            updateData.email = postData.email;
        }

        if (postData.isManager) {
            updateData.isManager = true;
        }

        var { managerId = null, peers = null } = postData;

        try {
            var manageExists = await this.validateManager(managerId);

            if (!manageExists) {
                return helpers.validationError(res, 'managerId is invalid');
            }

            if (managerId !== null) {
                updateData.managerId = mongoose.Types.ObjectId(managerId);
            }

            if (peers !== null && !(peers instanceof Array)) {
                peers = [peers];
            }

            var peersExists = await this.validatePeers(peers, updateData.isManager);

            if (!peersExists) {
                return helpers.validationError(res, 'Peer(s) is invalid');
            }

            if (peers && peers.length > 0) {
                peers = peers.map((el) => { return mongoose.Types.ObjectId(el); });
            }

            if (peers !== null) {
                updateData.peers = peers;
            }

            const employee: any = await Employee.findOneAndUpdate({ _id: param }, { $set: updateData }, { new: true });

            // set managerId of all peers
            if (employee.peers.length > 0) {
                const update = { $set: { managerId: mongoose.Types.ObjectId(employee._id) } };
                await Employee.update({ _id: { $in: employee.peers } }, update, { multi: true });
            }

            return helpers.success(res, employee);
        }
        catch (error) {
            console.log(error);

            if (error.name === 'ValidationError') {
                return helpers.validationError(res, error);
            }
            else if (error.message.indexOf('duplicate key error') !== -1) {
                return helpers.validationError(res, 'Email already exists');
            }
            else {
                return helpers.error(res);
            }
        }
    }

    // DELETE /employee/:id
    async delete(req, res, param) {
        var employee;
        try {
            employee = await Employee.get({ _id: param }, { isManager: 1 });
        }
        catch (e) {
            console.log(e);
        }

        if (!employee) {
            return helpers.error(res, 'Entity not found', 404);
        }

        try {
            var update, conditions;

            // delete peers
            try {
                update = { $pull: { peers: mongoose.Types.ObjectId(param) } };
                await Employee.update({}, update, { multi: true });
            }
            catch (e) {
                console.log('delete peers', e);
            }

            // set manager to null
            try {
                conditions = { managerId: mongoose.Types.ObjectId(param) };
                update = { $set: { managerId: null } };
                await Employee.update(conditions, update, { multi: true });
            }
            catch (e) {
                console.log('set manager to null', e);
            }

            conditions = { _id: param };
            await Employee.remove(conditions);

        }
        catch (error) {
            if (error != null)
                return helpers.error(res, error);
            else
                return helpers.success(res, "Succesfully deleted user");
        }
    }

    // Checks if a manager with given id exists
    async validateManager(managerId) {
        if (managerId === null) {
            return true;
        }

        try {
            const managerExists = await Employee.get({ _id: managerId, isManager: true }, null);
            return !!(managerExists);
        }
        catch (e) {
            return false;
        }
    }

    // Checks if all the peers exist in database
    async validatePeers(peers, isManager) {
        console.log(peers);
        if (peers === null) {
            return true;
        }

        if (peers.length && !isManager) {
            return false;
        }

        try {
            const peersExists: any = await Employee.getAll({ _id: { $in: peers } }, { _id: 1 });
            console.log(peersExists);
            return (peersExists.length === peers.length);
        }
        catch (e) {
            return false;
        }
    }
}

export const employeeController = new EmployeeController();
