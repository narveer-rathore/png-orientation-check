const request = require('request');
const sharp = require('sharp');
const imageUrls = require('./images.js');

async function isOrientationDefined(imageUrl) {
    return new Promise((resolve, reject) => {
        // Download the image
        request({ url: imageUrl, encoding: null }, (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }

            // Read metadata using sharp
            sharp(body)
                .metadata()
                .then(metadata => {
                    // Check if orientation is defined in general metadata
                    if (metadata.orientation !== undefined) {
                        resolve({ imageUrl, orientationDefined: true });
                    } else {
                        // Check if orientation is defined in EXIF metadata
                        sharp(body)
                            .rotate()
                            .toBuffer({ resolveWithObject: true })
                            .then(result => {
                                if (result.info.orientation !== undefined) {
                                    resolve({ imageUrl, orientationDefined: true });
                                } else {
                                    resolve({ imageUrl, orientationDefined: false });
                                }
                            })
                            .catch(() => reject('Error reading metadata ' + imageUrl));
                    }
                })
                .catch(() => reject('Error reading metadata ' + imageUrl));
        });
    });
}

let errors = [];

async function processImageBatch(imageUrls) {
    const batchSize = 10;

    for (let i = 0; i < imageUrls.length; i += batchSize) {
        const batch = imageUrls.slice(i, i + batchSize);

        try {
            // Execute isOrientationDefined for each image URL in the batch concurrently
            const results = await Promise.all(batch.map(url => isOrientationDefined(url)));

            // Filter URLs where orientation is defined
            const definedOrientationUrls = results.filter(result => result.orientationDefined).map(result => result.imageUrl);
            errors = errors.concat(definedOrientationUrls);
            // console.log(`Batch ${i / batchSize + 1}: URLs with defined orientation:`, definedOrientationUrls);
        } catch (error) {
            console.error('Error:', error);
        }
    }
    console.log('Found Errors:', errors.length)
    console.log(errors);
}

processImageBatch(imageUrls);
