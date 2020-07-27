const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const brain = require('brain.js');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3333;

app.use(express.static(path.resolve(__dirname, '..', 'build')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const dataDir = `${__dirname}/data`;

const loadFiles = () => {
  const fileNames = fs.readdirSync(dataDir);
  let files = {};

  fileNames.forEach((fileName) => {
    files[fileName] = loadFile(fileName);
  });

  return files;
};

const loadFile = (fileName) => {
  let fileContent = fs.readFileSync(`${dataDir}/${fileName}`, `utf-8`);

  let lines = fileContent.split('\n');
  let fields = lines[0].split(',');

  fields.forEach((field, fieldIndex) => {
    fields[fieldIndex] = field.replace(/[^a-zA-Z]+/g, '');
  });

  let data = {};

  for (let i = 1; i < lines.length; i++) {
    let lineParts = lines[i].split(',');

    if (lineParts.length <= 1) continue;

    let machineID = 1;
    let obj = {};

    lineParts.forEach((part, partIndex) => {
      let field = fields[partIndex];

      if (field === 'datetime') part = Date.parse(part);
      else {
        part = part.replace(/[^a-zA-Z0-9.]+/g, '');

        if (parseFloat(part) || part === '0') part = parseFloat(part);
      }

      if (field === 'machineID') {
        machineID = part;

        return 0;
      }

      obj[field] = part;
    });

    if (!data[machineID]) data[machineID] = [];

    data[machineID].push(obj);
  }

  for (let dataKey in data) {
    data[dataKey].sort((a, b) => {
      return a.datetime - b.datetime;
    });
  }

  return data;
};

const createRanges = () => {
  let ranges = {
    compDaysMax: (Date.parse(`2015-12-31 06:00:00`) - Date.parse(`2014-06-01 06:00:00`)) / (1000 * 60 * 60 * 24),
    errMax: 6,
    volt: { min: 10000, max: 0 },
    rotate: { min: 10000, max: 0 },
    pressure: { min: 10000, max: 0 },
    vibration: { min: 10000, max: 0 },
  };

  const telemetry = loadFile('PdM_telemetry.csv');

  for (let machineID in telemetry) {
    telemetry[machineID].forEach((teleRecord) => {
      if (teleRecord.volt < ranges.volt.min) ranges.volt.min = teleRecord.volt;
      if (teleRecord.volt > ranges.volt.max) ranges.volt.max = teleRecord.volt;

      if (teleRecord.rotate < ranges.rotate.min) ranges.rotate.min = teleRecord.rotate;
      if (teleRecord.rotate > ranges.rotate.max) ranges.rotate.max = teleRecord.rotate;

      if (teleRecord.pressure < ranges.pressure.min) ranges.pressure.min = teleRecord.pressure;
      if (teleRecord.pressure > ranges.pressure.max) ranges.pressure.max = teleRecord.pressure;

      if (teleRecord.vibration < ranges.vibration.min) ranges.vibration.min = teleRecord.vibration;
      if (teleRecord.vibration > ranges.vibration.max) ranges.vibration.max = teleRecord.vibration;
    });
  }

  return ranges;
};

const createMachinesData = () => {
  const files = loadFiles();

  let machinesArray = [];

  const telemetry = files['PdM_telemetry.csv'];
  const errors = files['PdM_errors.csv'];
  const machines = files['PdM_machines.csv'];
  const maintenance = files['PdM_maint.csv'];

  for (let machineID in telemetry) {
    machineID = parseInt(machineID);

    let machine = machines[machineID];
    let model = parseInt(machine[0].model.split('model')[1]);

    let k = 0;

    let tele12h = [];
    let errors12h = [0, 0, 0, 0, 0];

    for (let i = k; i < k + 12; i++) {
      let tele = telemetry[machineID][i];

      tele12h.push(tele);

      for (let j = 0; j < errors12h.length; j++) {
        let errorIndex = errors[machineID].findIndex((error) => {
          return error.datetime === tele.datetime && error.errorID === `error${j + 1}`;
        });

        if (errorIndex === -1) continue;

        errors12h[j]++;
      }
    }

    let comps = [-1, -1, -1, -1];

    let maintIndex = 0;
    let maintRecord = maintenance[machineID][maintIndex];

    while (maintRecord.datetime <= tele12h[0].datetime) {
      comps[parseInt(maintRecord.comp.split('comp')[1]) - 1] = (tele12h[0].datetime - maintRecord.datetime) / (1000 * 60 * 60 * 24);

      maintIndex++;
      maintRecord = maintenance[machineID][maintIndex];

      if (!maintRecord) break;
    }

    comps.forEach((comp, compIndex) => {
      if (comp === -1) comps[compIndex] = tele12h[0].datetime - Date.parse(`2014-06-01 06:00:00`);
    });

    let machineObj = { id: machineID, model, age: machine[0].age, components: [], telemetry: {}, errors12h };

    comps.forEach((comp) => {
      machineObj.components.push({ days: comp });
    });

    let telemetryObj = { volt: [], rotate: [], pressure: [], vibration: [] };

    tele12h.forEach((tele) => {
      let arr = [tele.volt, tele.rotate, tele.pressure, tele.vibration];

      telemetryObj.volt.push(arr[0]);
      telemetryObj.rotate.push(arr[1]);
      telemetryObj.pressure.push(arr[2]);
      telemetryObj.vibration.push(arr[3]);
    });

    machineObj.telemetry = telemetryObj;

    machinesArray.push(machineObj);
  }

  return machinesArray;
};

const dbName = 'sigmatica_case_in';
const mongooseOptions = {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true,
};

mongoose.connect(`mongodb://localhost/${dbName}`, mongooseOptions, (err) => {
  if (err) throw err;
});

const Machine = require('./models/Machine');

mongoose.connection.on('connected', async () => {
  console.log(`Подключение к базе данных "${dbName}" выполнено успешно.`);

  mongoose.connection.db.listCollections({ name: 'machines' }).next((err, collinfo) => {
    if (collinfo) return console.log('Датасет станков найден.');

    console.log('Датасет станков не найден. Создаем...');

    const machinesArray = createMachinesData();

    machinesArray.forEach(async (machine) => {
      await Machine.create(machine);
    });

    console.log('Датасет станков создан.');
  });
});

const random = (min, max) => {
  return Math.floor(Math.random() * (max + 1 - min) + min);
};

const shuffleArray = (array) => {
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  while (0 !== currentIndex) {
    randomIndex = random(0, currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

app.get('/api/create-nn', (req, res) => {
  createNN();

  res.json('NN created!');
});

app.get('/api/ranges', (req, res) => {
  const ranges = createRanges();

  res.json(ranges);
});

const createNN = () => {
  const files = loadFiles();
  const trainingSet = createTrainingSet(files);

  const config = {
    binaryThresh: 0.5,
    hiddenLayers: [59],
    activation: 'sigmoid',
  };
  const NN = new brain.NeuralNetwork(config);

  NN.train(trainingSet, {
    log: true,
    logPeriod: 1,
    learningRate: 0.3,
    errorThresh: 0.005,
    iterations: 20000,
  });

  fs.writeFileSync(`${__dirname}/../src/NN.json`, JSON.stringify(NN.toJSON()));
};

const createTrainingSet = (files) => {
  const ranges = createRanges(files);

  let trainingSet = [];

  const failures = files['PdM_failures.csv'];
  const telemetry = files['PdM_telemetry.csv'];
  const errors = files['PdM_errors.csv'];
  const machines = files['PdM_machines.csv'];
  const maintenance = files['PdM_maint.csv'];

  for (let machineID in telemetry) {
    machineID = parseInt(machineID);

    if (machineID === 50) break;

    let machine = machines[machineID];
    let model = parseInt(machine[0].model.split('model')[1]);

    for (let k = 0; k < telemetry[machineID].length - 24; k++) {
      let tele12h = [];
      let errors12h = [0, 0, 0, 0, 0];

      for (let i = k; i < k + 12; i++) {
        let tele = telemetry[machineID][i];

        tele12h.push(tele);

        for (let j = 0; j < errors12h.length; j++) {
          let errorIndex = errors[machineID].findIndex((error) => {
            return error.datetime === tele.datetime && error.errorID === `error${j + 1}`;
          });

          if (errorIndex === -1) continue;

          errors12h[j]++;
        }
      }

      let comps = [-1, -1, -1, -1];

      let maintIndex = 0;
      let maintRecord = maintenance[machineID][maintIndex];

      while (maintRecord.datetime <= tele12h[0].datetime) {
        comps[parseInt(maintRecord.comp.split('comp')[1]) - 1] = (tele12h[0].datetime - maintRecord.datetime) / (1000 * 60 * 60 * 24);

        maintIndex++;
        maintRecord = maintenance[machineID][maintIndex];

        if (!maintRecord) break;
      }

      comps.forEach((comp, compIndex) => {
        if (comp === -1) comps[compIndex] = tele12h[0].datetime - Date.parse(`2014-06-01 06:00:00`);
      });

      let input = [model, machine[0].age].concat(errors12h).concat(comps);

      tele12h.forEach((tele) => {
        input.push(tele.volt, tele.rotate, tele.pressure, tele.vibration);
      });

      let output = [0, 0, 0, 0];

      if (failures[machineID]) {
        failures[machineID].forEach((failRecord) => {
          if (failRecord.datetime === telemetry[machineID][k + 24].datetime) {
            output[parseInt(failRecord.failure.split('comp')[1]) - 1] = 1;
          }
        });
      }

      if (output.join('') === '0000') {
        if (Math.random() < 0.001) trainingSet.push({ input, output });
      } else {
        trainingSet.push({ input, output });
      }
    }
  }

  let j = 0;

  trainingSet.forEach((trainingRecord) => {
    trainingRecord.input.forEach((item, itemIndex) => {
      if (itemIndex === 0) {
        trainingRecord.input[itemIndex] = (4 - item) / (4 - 1);
      } else if (itemIndex === 1) {
        trainingRecord.input[itemIndex] = item / 20;
      } else if (itemIndex > 1 && itemIndex <= 6) {
        trainingRecord.input[itemIndex] = item / ranges.errMax;
      } else if (itemIndex > 6 && itemIndex <= 10) {
        trainingRecord.input[itemIndex] = item / ranges.compDaysMax;
      } else {
        if (j === 0) {
          trainingRecord.input[itemIndex] = (ranges.volt.max - item) / (ranges.volt.max - ranges.volt.min);
        } else if (j === 1) {
          trainingRecord.input[itemIndex] = (ranges.rotate.max - item) / (ranges.rotate.max - ranges.rotate.min);
        } else if (j === 2) {
          trainingRecord.input[itemIndex] = (ranges.pressure.max - item) / (ranges.pressure.max - ranges.pressure.min);
        } else if (j === 3) {
          trainingRecord.input[itemIndex] = (ranges.vibration.max - item) / (ranges.vibration.max - ranges.vibration.min);
        }

        j++;

        if (j === 4) j = 0;
      }
    });
  });

  shuffleArray(trainingSet);

  return trainingSet;
};

app.use('/api/requests', require('./routes/Requests'));
app.use('/api/machines', require('./routes/Machines'));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
});

app.listen(PORT, (err) => {
  if (err) throw err;

  console.log(`Прототип системы управления ТОиР команды "Сигматика" запущен по адресу http://localhost:${PORT}`);
});
