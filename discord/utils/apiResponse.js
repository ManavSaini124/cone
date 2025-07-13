class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

module.exports = ApiResponse;

// return res
//         .status(200)
//         .json(new ApiResponse(201, createdUser,"User created successfully")) 
