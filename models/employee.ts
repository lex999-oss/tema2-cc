import * as mongoose from 'mongoose';
//import * as BaseModel from './base';
import {connectionInstance}  from './base';

const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    
    // Name of the employee
    name: {
        type: String,
        required: true
    },

    // Email of the employee
    email: {
        type: String,
        validate: {
            validator: function(v) {
                return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
            },
            message: '{VALUE} is not a valid email!'
        },
        required: true,
        unique: true
    },

    // Indicates if the employee is a manager. We are managing
    // employees and managers in same collection
    isManager: {
        type: Boolean,
        default: false
    },

    // List of employees who have this employee as manager
    peers: {
        type: Array,
        default: []
    },

    // Employee's manager
    managerId: {
        type: Schema.Types.ObjectId
    }
}, { timestamps: false });

employeeSchema.set('toClient', function () {
    const employee = this.toObject();

    delete employee.__v;
    return employee;
});


const employeeModel = connectionInstance.model('employees', employeeSchema);

export class Employee {
    static create (data: any) {
        const newEmployee = new employeeModel(data);

        return new Promise((resolve, reject) => {
            const error = newEmployee.validateSync();
            if (error) {
                reject(error);
            }

            newEmployee.save((err, obj) => {
                if (obj) {
                    resolve(obj);
                }
                else {
                    reject(err);
                }
            });
        });
    }

    static getAll (conditions: object, selectParams: object) {
        return new Promise((resolve, reject) => {
            const query = employeeModel.find(conditions);

            if (selectParams) {
                query.select(selectParams);
            }

            query.lean().exec((err: any, docs: any) => {
                if (docs) {
                    resolve(docs);
                }
                else {
                    reject(err);
                }
            });
        });
    }

    static get (conditions: any, selectParams: any) {
        return new Promise((resolve, reject) => {
            const query = employeeModel.findOne(conditions);

            if (selectParams) {
                query.select(selectParams);
            }

            query.lean().exec((err: any, docs: any) => {
                if (docs) {
                    resolve(docs);
                }
                else {
                    reject(err);
                }
            });
        });
    }

    static remove (conditions: any) {
        return new Promise((resolve, reject) => {
            employeeModel.remove(conditions, (err: mongoose.NativeError) => {
                    reject(err);
            });
        });
    }

    static findOneAndUpdate (conditions, updateData, options) {
        return new Promise((resolve, reject) => {
            employeeModel.findOneAndUpdate(conditions, updateData, options, (err: any, docs: any) => {
                if (docs) {
                    resolve(docs);
                }
                else {
                    reject(err);
                }
            });
        });
    }

    static update (conditions: any, updateData: any, options: any) {
        return new Promise((resolve, reject) => {
            employeeModel.update(conditions, updateData, options, (err: any, docs: any) => {
                if (docs) {
                    resolve(docs);
                }
                else {
                    reject(err);
                }
            });
        });
    }

    static aggregation (pipeline: any) {
        return new Promise((resolve, reject) => {
            employeeModel.aggregate(pipeline, (err: any, docs: any) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(docs);
                }
            });
        });
    }
}