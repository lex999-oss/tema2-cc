export function validationError(res: any, error: string = 'Data provided is not valid') {
    addHeaders(res);

    res.statusCode = 422;

    res.end(JSON.stringify({
        status: 'fail',
            error
    }, null, 3));
};

export function error (res: any, error: string = 'An unknown error occurred', statusCode: number = 500) {
    addHeaders(res);

    res.statusCode = statusCode;

    res.end(JSON.stringify({
        status: 'fail',
        error
    }, null, 3));
};

export function success (res: any, data: any = null) {
    addHeaders(res);

    res.statusCode = 200;

    res.end(JSON.stringify({
        status: 'success',
        data
    }, null, 3));
};

function addHeaders(res: any){
    return res.setHeader('Content-Type', 'application/json');
}