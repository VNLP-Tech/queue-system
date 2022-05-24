# queue-system
Base queue for call system

Problem:
- Our system need limit number of concurrent calls at a threshold.
- We can change the limit on the fly, at runtime.
- Our limitation should be distributed limit for multiple instances.

### Installation
```bash
# install dependencies
npm i
```

### Start
```bash
# run server to serve queue
npm start
```

### Add job
```bash
# can adjust data job in `test/add-job.js`
npm run job
```

### Setting maxCCU
You can change maxCCU in DB to increase/decrease CCU of system.
