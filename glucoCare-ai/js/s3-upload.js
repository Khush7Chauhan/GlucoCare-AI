

function uploadFileToS3(file) {
  AWS.config.update({
    accessKeyId: 'AKIAZF6XXXXXXXXXX',
    secretAccessKey: 'Fm3VOcc0BwFTr82NmvXXXXXXXXXXXXXX',
    region: 'ap-south-1'

  });

  const s3 = new AWS.S3();

  const params = {
    Bucket: 'glucocare-bucket',
    Key: `reports/${Date.now()}_${file.name}`, 
    Body: file,
    ContentType: file.type
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data.Location); 
      }
    });
  });
}