const notFound = (req,res,next)=>{
    const error = new Error (`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); 
}

const errorHandler = (err , req,res,next)=>{
    const statusCode = res.statusCode===200? 500: res.statusCode;
    res.status(statusCode);

    //Being more specific for particular errors
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
     return res.status(404).json({
       message: 'Resource not found. The ID provided is in an invalid format.',
     });
    }

    res.json({
        message: err.message,
        // The 'stack' trace is a detailed log of where the error happened.
        // We only want to show this extra detail when we're developing, not to the public in a live application.
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });

};

export {notFound ,errorHandler};

  