exports.callCampaign = async (data, done) => {
    console.log('consume data job', data.key);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
            console.log('done consume', data.key);
        }, 15000);
    })
};
