const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const fs = require('fs');
const path = require("path");
const { config } = require('./../configs')
const { S3_FOLDER_NAME } = require('./../constants')
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
// const errors = require("../responses/response").errors;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.originalname}`
      // `${file.fieldname}-${uniqueSuffix}-${file.originalname}`
    );
    //`${file.fieldname}-${uniqueSuffix}.${file.originalname.split(".")[1]}`
    //cb(null, file.originalname);
  },
});
// const KccStorage = multerS3({
//   s3: s3,
//   bucket: "pre-prod-agrotech",
//   acl: "public-read",
//   metadata: function (req, file, cb) {
//     cb(null, { fieldName: file.fieldname });
//   }
//   ,
//   key: function (req, file, cb) {
//     cb(null, `${Kcc}/${file.originalname}`);
//   }
  
// })
const reportsStorage = multerS3({
  s3: s3,
  bucket: "pre-prod-agrotech/reports",
  acl: "public-read",
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  }
  ,
  key: function (req, file, cb) {
    cb(null, `${file.originalname}`);
  }
  
})
const reportsImageStorage = multerS3({
  s3: s3,
  bucket: "pre-prod-agrotech/reportsImage",
  acl: "public-read",
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  }
  ,
  
  key: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, `${file.originalname}`);
  }

  
})

const s3Storage = multerS3({
  s3: s3,
  bucket: function (req, file, cb) {
    let bucket = ""
    console.log("Field name", file.fieldname)
    if (file.fieldname == S3_FOLDER_NAME.PRESCRIPTION) {
      bucket = BUCKET_NAME + "/" + S3_FOLDER_NAME.PRESCRIPTION
    } else if (file.fieldname == S3_FOLDER_NAME.DOCUMENT) {
      bucket = BUCKET_NAME + "/" + S3_FOLDER_NAME.DOCUMENT
    } else if (file.fieldname == S3_FOLDER_NAME.PRODUCT_IMAGES) {
      bucket = BUCKET_NAME + "/" + S3_FOLDER_NAME.PRODUCT_IMAGES
    } else if (file.fieldname == S3_FOLDER_NAME.INVOICE) {
      bucket = BUCKET_NAME + "/" + S3_FOLDER_NAME.INVOICE
    } else {
      bucket = BUCKET_NAME + "/" + S3_FOLDER_NAME.OTHERS
    }
    console.log("Bucket name", bucket)
    cb(null, bucket)
  },
  acl: "public-read",
  contentType: function (req, file, cb) {
    cb(null, file.mimetype)
  },
  limits: { fileSize: 1024 * 1024 * 50 },
  key: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    console.log("Inside s3 upload", file)
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}-${file.originalname}`
    );
  },
});

const documentFilter = (req, file, cb) => {
  console.log("file inside doc filter", file)
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg" ||
    file.mimetype == "application/pdf" ||
    file.mimetype == "image/svg+xml" ||
    file.mimetype == "application/msword" ||
    file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingm" ||
    file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype == "image/webp"
  ) {
    console.log(true)
    cb(null, true);
  } else {
    return cb(new Error("Only .png, .jpg, .svg, .doc, .docx, .webp and .jpeg format allowed!"));
  }
};
const imageFilter = (req, file, cb) => {
  console.log("file inside doc filter", file)
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg" ||
    file.mimetype == "image/svg+xml" ||
    file.mimetype == "image/webp"
  ) {
    console.log(true)
    cb(null, true);
  } else {
    return cb(new Error("Only .png, .jpg, .svg, .webp and .jpeg format allowed!"));
  }
};
const documentFilterForPdf = (req, file, cb) => {
  console.log("file inside doc filter", file)
  if ( file.mimetype == "application/pdf") {
    console.log(true)
    cb(null, true);
  } else {
    return cb(new Error("Only .pdf format allowed!"));
  }
};

const documentFilterForExcel = (req, file, cb) => {
  console.log("Inside document filter");
  if (
    file.mimetype == "text/csv" ||
    file.mimetype ==
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype == "application/vnd.ms-excel"
  ) {
    console.log("valid extensions");
    cb(null, true);
  } else {
    console.log("Not valid extensions");
    return cb(new Error("Only .xlsx, .xls and .csv format allowed!"));
  }
};
const documentFilterForVideo = (req, file, cb) => {
  console.log("Inside document filter");
  if (
    file.mimetype == "video/x-flv" ||
    file.mimetype == "video/mp4" ||
    file.mimetype == "application/x-mpegURL" ||
    file.mimetype == "video/MP2T" ||
    file.mimetype == "video/3gpp" ||
    file.mimetype == "video/quicktime" ||
    file.mimetype == "video/x-msvideo" ||
    file.mimetype == "video/x-ms-wmv"
  ) {
    console.log("valid extensions");
    cb(null, true);
  } else {
    console.log("Not valid extensions");
    return cb(
      new Error(
        "Only video/x-flv,video/mp4,application/x-mpegURL,video/MP2T,video/3gpp,video/quicktime,video/x-msvideo,video/x-ms-wmv format allowed!"
      )
    );
  }
};

const upload = multer({
  // storage: process.env.NODE_ENV.toLowerCase().indexOf(config.PROD) > -1 ? s3Storage : storage,
  storage: storage,
  fileFilter: documentFilterForPdf,
});

const uploadReports = multer({
  // storage: process.env.NODE_ENV.toLowerCase().indexOf(config.PROD) > -1 ? s3Storage : storage,
  storage: reportsStorage,
  fileFilter: documentFilterForPdf,
});
const uploadImage = multer({
  // storage: process.env.NODE_ENV.toLowerCase().indexOf(config.PROD) > -1 ? s3Storage : storage,
  storage: reportsImageStorage,
  fileFilter: imageFilter,
});
// const uploadImage = multer({
//   storage: storage,
//   limits: { fileSize: 1024 * 1024 * 50 },
//   //   fileFilter: function (req, file, cb) {
//   //     checkFileType(file, cb);
//   //   },
// });
const uploadExcel = multer({
  storage: storage,
  fileFilter: documentFilterForExcel,
});
const uploadVideo = multer({
  storage: process.env.NODE_ENV.toLowerCase().indexOf(config.PROD) > -1 ? s3Storage : storage,
  fileFilter: documentFilterForVideo,
});

module.exports = {
  upload,
  uploadExcel,
  uploadVideo,
  uploadReports,
  uploadImage
};
