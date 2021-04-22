// MIT License
// Copyright (c) 2021 Mats Selen
// ---------------------------------

'use strict';

//===================================================================
// summarize some useful info from config.js
function getIOLabConfigInfo() {

  // store information about each sensor, indexed by sensor number
  for (let ind = 0; ind < iolabConfig.sensors.length; ind++) {
    let sens = iolabConfig.sensors[ind];
    sensorInfoList[sens.code] = sens;
  }

  // store information about each fixed configuration, index by config number
  for (let ind = 0; ind < iolabConfig.fixedConfigurations.length; ind++) {
    let fc = iolabConfig.fixedConfigurations[ind];

    let sensList = [];
    let rateList = [];
    //let longDesc = fc.code.toString() + " [" + fc.desc + "] ";
    let longDesc = fc.code.toString() + ": ";
    //let longDesc = "";
    let longDesc2 = "";
    for (let sens = 0; sens < fc.sensors.length; sens++) {
      let skey = fc.sensors[sens].sensorKey;
      let srate = fc.sensors[sens].sampleRate;
      longDesc2 += sensorInfoList[skey].shortDesc + '(' + srate.toString() + 'Hz) ';
      longDesc += sensorInfoList[skey].shortDesc + '(' + srate.toString() + ') ';

      sensList.push(skey);
      rateList.push(srate);
    }

    fc.sensList = sensList;
    fc.rateList = rateList;
    fc.longDesc = longDesc.slice(0, -1);
    fc.longDesc2 = longDesc2.slice(0, -1);


    fixedConfigList[fc.code] = fc;
  }

}


//====================================================================
// returns the appropriate byte array for the requested command record
function getCommandRecord(command, remoteID, payload) {

  // set defaults in cases where remoteID or payload are undefined
  // (for now we are using only remote 1)
  if (typeof remoteID === "undefined") { remoteID = 1 }
  if (typeof payload === "undefined") { payload = 2 }

  var byteArray = 0;

  if (command == "getDongleStatus") {
    byteArray = new Uint8Array([0x02, 0x14, 0x00, 0x0A]);

  } else if (command == "getPairing") {
    byteArray = new Uint8Array([0x02, 0x12, 0x00, 0x0A]);

  } else if (command == "getRemoteStatus") {
    remoteID = 1;
    byteArray = new Uint8Array([0x02, 0x2A, 0x01, remoteID, 0x0A]);

  } else if (command == "setFixedConfig") {
    remoteID = 1, payload = current_config_code;
    byteArray = new Uint8Array([0x02, 0x26, 0x02, remoteID, payload, 0x0A]);

  } else if (command == "getFixedConfig") {
    remoteID = 1;
    byteArray = new Uint8Array([0x02, 0x27, 0x01, remoteID, 0x0A]);

  } else if (command == "getPacketConfig") {
    remoteID = 1;
    byteArray = new Uint8Array([0x02, 0x28, 0x01, remoteID, 0x0A]);

  } else if (command == "getBarometerCalibration") {
    remoteID = 1;
    byteArray = new Uint8Array([0x02, 0x29, 0x02, remoteID, 4, 0x0A]);

  } else if (command == "getThermometerCalibration") {
    remoteID = 1;
    byteArray = new Uint8Array([0x02, 0x29, 0x02, remoteID, 26, 0x0A]);

  } else if (command == "startData") {
    byteArray = new Uint8Array([0x02, 0x20, 0x00, 0x0A]);

  } else if (command == "stopData") {
    byteArray = new Uint8Array([0x02, 0x21, 0x00, 0x0A]);

  } else if (command == "powerDown") {
    remoteID = 1;
    byteArray = new Uint8Array([0x02, 0x2B, 0x01, remoteID, 0x0A]);

  }

  return byteArray;
}

//====================================================================
// construct the drop-down menu for selecting commands 
// (should be consistent with the commands defined above)
function buildCmdPicker() {

  let cmdPicker = document.getElementById('cmd-picker');
  let cmdOption = null;

  // build drowpdown menu
  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "getDongleStatus";
  cmdPicker.appendChild(cmdOption);

  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "startData";
  cmdPicker.appendChild(cmdOption);

  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "stopData";
  cmdPicker.appendChild(cmdOption);

  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "setFixedConfig";
  cmdPicker.appendChild(cmdOption);

  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "getFixedConfig";
  cmdPicker.appendChild(cmdOption);

  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "getPacketConfig";
  cmdPicker.appendChild(cmdOption);

  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "getPairing";
  cmdPicker.appendChild(cmdOption);

  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "getRemoteStatus";
  cmdPicker.appendChild(cmdOption);

  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "getBarometerCalibration";
  cmdPicker.appendChild(cmdOption);

  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "getThermometerCalibration";
  cmdPicker.appendChild(cmdOption);

  cmdOption = document.createElement('option');
  cmdOption.value = cmdOption.innerText = "powerDown";
  cmdPicker.appendChild(cmdOption);

  // default to setFixedConfig
  cmdPicker.selectedIndex = 3;
  current_cmd = cmdPicker.options[cmdPicker.selectedIndex].value;
  document.getElementById('config-picker').style.visibility = "visible";

  cmdPicker.onchange = function () {

    current_cmd = cmdPicker.options[cmdPicker.selectedIndex].value;
    console.log("current_cmd= " + current_cmd);

    if (current_cmd == "setFixedConfig") {
      document.getElementById('config-picker').style.visibility = "visible";
    } else {
      document.getElementById('config-picker').style.visibility = "hidden";
    }
    updateSystemState();

  };
}

//====================================================================
// construct the drop-down menu for the DAC control
async function buildDacPicker() {

  for (let i = 0; i < iolabConfig.DACValues.length; i++) {
    var dacOption = document.createElement('option');
    dacOption.value = 32 + iolabConfig.DACValues[i].val;        // the key-value for each DAC setting
    dacOption.innerText = iolabConfig.DACValues[i].lbl + " V";  // the menu text for each DAC setting
    dacPicker.appendChild(dacOption);
  }
  dacPicker.selectedIndex = 17;

  // when the DAC voltage is changed
  dacPicker.onchange = async function () {
    setDacVoltage();
  }

  dacUp.addEventListener("click", async function () {
    if(dacPicker.selectedIndex < (iolabConfig.DACValues.length-1)) {
      dacPicker.selectedIndex += 1;
    }
    setDacVoltage();
  });

  dacDn.addEventListener("click", async function () {
    if(dacPicker.selectedIndex > 0) {
      dacPicker.selectedIndex -= 1;
    }
    setDacVoltage();
  });

  // when the DAC box is checked or unchecked
  dacCK.addEventListener("click", async function () {
    dacEnable(this.checked);
  });

  async function setDacVoltage(remoteID = 1) {
    let dacValue = dacPicker.options[dacPicker.selectedIndex].value;
    let kvPair = parseInt(dacValue);
    await sendOutputConfig(remoteID, [1, 0x19, kvPair]);
    setTimeout(async function () {
      await sendOutputConfig(remoteID, [1, 0x19, kvPair]);
    }, 25);
  }

  async function dacEnable(turnOn, remoteID = 1) {
    let val = 0;
    if (turnOn) val = 1;
    await sendOutputConfig(remoteID, [1, 0x19, val]);
    setTimeout(async function () {
      await sendOutputConfig(remoteID, [1, 0x19, val]);
    }, 25);

  }
}

//====================================================================
// construct the drop-down menu for buzzer control
async function buildBzzPicker() {

  for (let i = 0; i < iolabConfig.BzzValues.length; i++) {
    var bzzOption = document.createElement('option');
    bzzOption.value = 32 + iolabConfig.BzzValues[i].val;        // the key-value for each DAC setting
    bzzOption.innerText = iolabConfig.BzzValues[i].lbl + " Hz";  // the menu text for each DAC setting
    bzzPicker.appendChild(bzzOption);
  }
  bzzPicker.selectedIndex = 8;

  // when the Bzz frequency is changed
  bzzPicker.onchange = async function () {
    setBzzFrequency();
  }

  // when the Bzz box is checked or unchecked
  bzzCK.addEventListener("click", async function () {
    bzzEnable(this.checked);
  });

  async function setBzzFrequency(remoteID = 1) {
    let bzzValue = bzzPicker.options[bzzPicker.selectedIndex].value;
    let kvPair = parseInt(bzzValue);
    await sendOutputConfig(remoteID, [1, 0x18, kvPair]);
    setTimeout(async function () {
      await sendOutputConfig(remoteID, [1, 0x18, kvPair]);
    }, 25);
  }

  async function bzzEnable(turnOn, remoteID = 1) {
    let val = 0;
    if (turnOn) val = 1;
    let bzzValue = bzzPicker.options[bzzPicker.selectedIndex].value;
    let kvPair = parseInt(bzzValue);    
    await sendOutputConfig(remoteID, [2, 0x18, kvPair, 0x18, val]);
    setTimeout(async function () {
      await sendOutputConfig(remoteID, [2, 0x18, kvPair, 0x18, val]);
    }, 25);

  }
}

//====================================================================
// construct the drop-down menu for the D5 control
async function buildD5Picker() {

  for (let i = 0; i < iolabConfig.D5Values.length; i++) {
    var d5Option = document.createElement('option');
    let key = iolabConfig.D5Values[i].key;
    let value = iolabConfig.D5Values[i].val;
    d5Option.value = (key << 5) + value;                            // the key-value for each setting
    d5Option.innerText = iolabConfig.D5Values[i].lbl + " Hz";  // the menu text for each setting
    d5Picker.appendChild(d5Option);
  }

  d5Ctl.hidden = true; // dont display this until the option is selected
  d5Picker.selectedIndex = 3;

  // when the D5 voltage is changed
  d5Picker.onchange = async function () {
    setD5Frequency();
  }

  // when the D5 box is checked or unchecked
  d5CK.addEventListener("click", async function () {
    d5Enable(this.checked);
  });

  async function setD5Frequency(remoteID = 1) {
    let D5Value = d5Picker.options[d5Picker.selectedIndex].value;
    let kvPair = parseInt(D5Value);
    await sendOutputConfig(remoteID, [1, 0x13, kvPair]);
  }

  async function d5Enable(turnOn, remoteID = 1) {
    let val = 0;
    if (turnOn) val = 2;
    let D5Value = d5Picker.options[d5Picker.selectedIndex].value;
    let kvPair = parseInt(D5Value);    
    await sendOutputConfig(remoteID, [2, 0x13, kvPair, 0x13, val]);
  }

}

//====================================================================
// construct the drop-down menu for selecting fixed configurations
function buildConfigPicker() {

  // var configPicker = document.getElementById('config-picker');
  var configOption = document.createElement('option');
  configOption.value = configOption.innerText = "Select Sensor Combintion (sample rate in Hz) then click Configure";
  configPicker.appendChild(configOption);

  for (let i = 0; i < iolabConfig.fixedConfigurations.length; i++) {
    configOption = document.createElement('option');

    let code = iolabConfig.fixedConfigurations[i].code;
    configOption.value = configOption.innerText = fixedConfigList[code].longDesc;

    configPicker.appendChild(configOption);
  }

  //configPicker.selectedIndex = 17; // default to "kitchen sink"
  //configPicker.selectedIndex = 13; // default to accelerometer
  configPicker.selectedIndex = 0;
  current_config = configPicker.options[configPicker.selectedIndex].value;
  current_config_code = -1;

  document.getElementById('config-picker').style.visibility = "hidden";

  configPicker.onchange = function () {
    console.log("selecting config-picker index ", configPicker.selectedIndex);
    current_config = configPicker.options[configPicker.selectedIndex].value;
    daqConfigured = false;

    if (configPicker.selectedIndex == 0) {
      current_config_code = -1;
      configPicker.title = "Select Configuration";
    } else {
      current_config_code = iolabConfig.fixedConfigurations[configPicker.selectedIndex - 1]["code"];
      configPicker.title = fixedConfigList[current_config_code].longDesc2;
    }
    updateSystemState();
  }

}
