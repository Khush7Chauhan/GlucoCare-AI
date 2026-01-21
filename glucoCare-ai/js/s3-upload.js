// You might need to use a script tag in HTML for AWS SDK if ESM imports are tricky
// <script src="https://sdk.amazonaws.com/js/aws-sdk-2.1001.0.min.js"></script>

function uploadFileToS3(file) {
  AWS.config.update({
    accessKeyId: 'AKIXXXXXXXXXXXXXX',
    secretAccessKey: 'Fm3VOcc0BwFXXXXXXXXXXXXXXXXXXX',
    region: 'ap-south-1'

  });

  const s3 = new AWS.S3();

  const params = {
    Bucket: 'glucocare-bucket',
    Key: `reports/${Date.now()}_${file.name}`, // Unique filename
    Body: file,
    ContentType: file.type
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data.Location); // Returns the file URL
      }
    });
  });
}