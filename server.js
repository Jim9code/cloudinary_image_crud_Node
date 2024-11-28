const express = require('express')
const dotenv = require('dotenv').config()
const mysql = require('mysql2')
const cloudinary = require('cloudinary').v2
const multer = require('multer')




const app = express()
const path = require('path')


// uses
app.use(express.json())


// db config
const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  });
  pool.getConnection((err, connection) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`Connected to DB on ${connection.threadId}`);
    }
  });
//   cloudinary config
 cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
 })
// multer config
     const upload =  multer({
    storage:multer.diskStorage({}),
    fileFilter:(req,file,cb)=>{
        let ext = path.extname(file.originalname);
        if(ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png"){
            cb(new Error("File type is not surported"),false);
            return;
        }
        cb(null,true)
    }
})



app.post('/',upload.single('image'), async (req,res)=>{
    try {
        const result = await cloudinary.uploader.upload(req.file.path,{
                folder: 'uploads',
               width: 500, // Resize width
                height: 500, // Resize height
                crop: 'fit' // Resize mode
              });
                  
              
              
      // Save image data to MySQL database
    const { originalname, mimetype, size } = req.file;
    const sql = `
      INSERT INTO images (original_name, cloudinary_url, mimetype, size,public_id)
      VALUES (?, ?, ?, ?,?)
    `;
    const params = [originalname, result.secure_url, mimetype, size,result.public_id];
    pool.query(sql, params, (err, results) => {
      if (err) {
        console.error('MySQL error:', err);
        return res.status(500).json({ error: 'Failed to save image data to the database' });
      }else{
        res.status(200).json({success:"Image processing was successful!"})
      }
    });

        
    } catch (err) {
        console.log(err);
            res.status(500).json({ error: 'Failed to process image' });
    }
})


// get url
app.get('/images',(req,res)=>{
  pool.query('select * from images where id = 1',(err,image)=>{
       if(err){
        console.log(err)
       }else{
        const img = image[0].cloudinary_url
        // console.log(img)
        res.send(`<div><img src=${img}></div>`) 
       }
  })
})

// delete a picture
app.post('/delete/:imgId', (req,res)=>{
  const imgId = req.params.imgId
      pool.query('select public_id from images where id = ?',[imgId],async (err,imgPublic_id)=>{
        if(err){
          console.log(err)
        }else{
          await cloudinary.uploader.destroy(imgPublic_id[0].public_id)
          pool.query('delete from images where id = ?',(imgId),(err)=>{
            if(err){
              console.log(err)
            }else{
              res.json({success:"delete was successful"})
            }
          })
        }
      })
})




const port = process.env.PORT || 5000
app.listen(port,()=>{
    console.log(`server running on port ${port}`)
})








// const express = require('express');
// const multer = require('multer');
// const { v2: cloudinary } = require('cloudinary');
// const mysql = require('mysql2');
// const dotenv = require('dotenv');
// const path = require('path');

// // Load environment variables
// dotenv.config();

// const app = express();

// // Multer configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });
// const upload = multer({ storage });

// // Cloudinary configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // MySQL connection
// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE
// });

// // API endpoint to upload and process image
// app.post('/upload', upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     // Upload to Cloudinary and resize the image
//     const result = await cloudinary.uploader.upload(req.file.path, {
//       folder: 'uploads',
//       width: 500, // Resize width
//       height: 500, // Resize height
//       crop: 'fit' // Resize mode
//     });

//     // Save image data to MySQL database
//     const { originalname, mimetype, size } = req.file;
//     const sql = `
//       INSERT INTO images (original_name, cloudinary_url, mimetype, size)
//       VALUES (?, ?, ?, ?)
//     `;
//     const params = [originalname, result.secure_url, mimetype, size];
//     db.query(sql, params, (err, results) => {
//       if (err) {
//         console.error('MySQL error:', err);
//         return res.status(500).json({ error: 'Failed to save image data to the database' });
//       }

//       res.status(200).json({
//         message: 'Image uploaded successfully',
//         cloudinary_url: result.secure_url,
//         db_id: results.insertId
//       });
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Failed to process image' });
//   }
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
