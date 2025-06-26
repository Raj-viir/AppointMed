import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import connectCloudinary from './config/cloudinary.js'
import connectDB from './config/mongodb.js'
import adminRouter from './routes/adminRoute.js'

//app config
const app = express()
const port =  process.env.PORT || 4000
connectDB()
connectCloudinary()

//middleware
app.use(express.json())
app.use(cors()) 

//API end point 
app.use('/api/admin',adminRouter)
//localhost:4000/api/admin/add-doctor

app.get('/' , (req,res)=>{
    res.send('API working')
})

app.listen(port, ()=> console.log("Server Started" , port))
