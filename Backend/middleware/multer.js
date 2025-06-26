import multer from 'multer'
const { diskStorage } = require("multer");

const storage = multer.diskStorage({
    failename: function(req,file,callback){
        callback(null, file.originalname)
    }
})
const upload = multer({storage})
export default upload