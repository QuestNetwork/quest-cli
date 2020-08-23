const exec = require('await-exec')
const chalk = require('chalk');
const figlet = require('figlet');
const cliSelect = require('cli-select');
const { MultiSelect } = require('enquirer');
const { Select } = require('enquirer');
const { Input } = require('enquirer');
const { spawn } = require('child_process');
const path = require('path');


const fs = require('fs');

let swarmJson;
let swarmInfoQueue;
let deployQueueJSON;
let retrySettings;
let projectFolder;
let projectsRoot;
let cliSwarmJson = {};
const cliName = "QuestCli";
const version = "0.9.2";

coldStart();

function logo(){
  console.clear();
  console.log(
    chalk.yellow(
      figlet.textSync(cliName, { horizontalLayout: 'full' })
    )
  );


  if(Math.random() >= 0.9){
    console.log(
      chalk.blue(
        'If you like this CLI, tip Bitcoin to: '
      )
    );
    console.log(
      chalk.green(
        'bc1qujrqa3s34r5h0exgmmcuf8ejhyydm8wwja4fmq'
      )
    );
    console.log();
  }
  else if(Math.random() >= 0.8){
    console.log(
      chalk.blue(
        'If you like this CLI, tip Ethereum to: '
      )
    );
    console.log(
      chalk.green(
        '0xBC2A050E7B87610Bc29657e7e7901DdBA6f2D34E'
      )
    );
    console.log();
  }




}

async function coldStart(){

  logo();

  try{
    cliSwarmJson = JSON.parse(fs.readFileSync("./swarm.json"));
    projectFolder = cliSwarmJson.defaultProject.folder;
    projectsRoot = cliSwarmJson.projectsRoot;
    selectProject();
  }
  catch(error){
    //no swarm json file, make one
      cliSwarmJson = {
        version: version,
        type: "cliSettings",
        name: "questCli",
      };



      try{
        console.log("Thank You For Choosing The Quest Network!");
        await delay(2000);
        let folderPrompt = new Input({
          message: 'Where can we find your projects?',
          initial: '../../'
        });
        let choice = await folderPrompt.run();

        projectsRoot =  path.resolve(__dirname, choice);

        if(projectsRoot.charAt(projectsRoot.length-1) != "/"){
         projectsRoot += "/";
        }
        let choices = [];
        let folders;
        cliSwarmJson['projectsRoot'] = projectsRoot;
        try{
          folders = fs.readdirSync(projectsRoot);
        }
        catch(error){
          console.log(error);
          await delay(20000);
        }


        for(var i = 0; i < folders.length; i++) {
          try{
            let projectSwarmJson = JSON.parse(fs.readFileSync(projectsRoot+folders[i]+"/swarm.json"));
            if(projectSwarmJson.type != 'cliSettings'){
              choices.push( { name:projectSwarmJson.name, value: folders[i] });
            }
          }
          catch(error){
            console.log(error);
            await delay(20000);

          }
        }

        let defaultProjectPrompt = new Select({
          name: 'color',
          message: 'Choose Default Project',
          choices: choices
        });
        choice = await defaultProjectPrompt.run();
        for(var i = 0; i < choices.length; i++) {
          if(choice == choices[i].name){
            projectFolder = choices[i].value;
            // console.log(projectFolder);
            setProject(projectFolder);

            //write to file
            cliSwarmJson['defaultProject'] = {
              name: choices[i].name,
              folder: choices[i].value
            }

            fs.writeFileSync('./swarm.json', JSON.stringify(cliSwarmJson, null, 2));      // console.log(res.stdout + res.stderr);
            welcome();
          }
        }

      }
      catch(error){
        console.clear();
      }

    }


}

async function setProject(projectFolder, newSwarmJson = undefined){
  if(typeof(newSwarmJson) == "undefined"){
      newSwarmJson = require(projectsRoot+projectFolder+"/swarm.json");
  }

  swarmJson = newSwarmJson;
  swarmInfoQueue = newSwarmJson.injectInfo;
  deployQueueJSON = newSwarmJson.packages;
  // console.log(deployQueueJSON);
  retrySettings =  newSwarmJson.retrySettings;
}

async function selectProject(){


  logo();

  let folders = fs.readdirSync(projectsRoot);
  let choices = [];
  choices.push( { name:"New Swarm", value: "create" });
  for(var i = 0; i < folders.length; i++) {
    try{
      let projectSwarmJson = JSON.parse(fs.readFileSync(projectsRoot+folders[i]+"/swarm.json"));
      if(cliSwarmJson.defaultProject.name == projectSwarmJson.name){
        choices.push( { name:projectSwarmJson.name, value: folders[i], enabled: true });
      }
      else if(projectSwarmJson.type != 'cliSettings'){
        choices.push( { name:projectSwarmJson.name, value: folders[i] });
      }


    }
    catch(error){

    }
  }

  // console.log(folders);

  // let choices = fs.readdirSync(projectsRoot);
  let prompt = new Select({
    name: 'color',
    message: 'Choose Swarm',
    choices: choices,
    initial: cliSwarmJson.defaultProject.name
    });

  let choice;
  try{
    choice = await prompt.run();
    if(choice.length < 1){
      // console.log('You Chose Nothing!');
      await delay(2000);
      selectProject();
    }else{
      if(choice == "New Swarm"){
        newSwarm();
      }else{
      //find folder
        for(var i = 0; i < choices.length; i++) {
          if(choice == choices[i].name){
            projectFolder = choices[i].value;
            // console.log(projectFolder);
            setProject(projectFolder);

            welcome();
          }
        }
      }
    }
  }
  catch(error){
    console.clear();
    await delay(500);
    console.log("See ya!");
    await delay(500);
    console.clear();

  }


}

async function newSwarm(){
  logo();

  let folderPrompt = new Input({
    message: 'What is the name for this swarm?',
    initial: 'myProject'
  });
  let choice = await folderPrompt.run();
  let newSwarmName = choice;
  let newSwarmFolder = newSwarmName;

  //write to file
  let projectSwarmJson = {
    version: version,
    type: "swarmProject",
    name: newSwarmName,
    retrySettings: {
      deploy: 2,
      hibernate: 5
    }
  }

  console.log("Creating Swarm...");
  fs.mkdirSync(projectsRoot+newSwarmName);
  fs.writeFileSync(projectsRoot+newSwarmName+'/swarm.json', JSON.stringify(projectSwarmJson, null, 2));      // console.log(res.stdout + res.stderr);
  await delay(1000);

  coldStart();
}

async function welcome(){


  logo();
  console.log(chalk.yellow("Swarm: "+projectFolder));

  let values = [];
  if(typeof(swarmJson.apps) != "undefined" && swarmJson.apps.length > 0){
    values.push("Run Swarm Apps Locally");
  }

  values.push("New App");
  values.push("Remove Apps");


  if(typeof(swarmJson.packages) != "undefined" && swarmJson.packages.length > 0){
    values.push("Deploy All Swarm Packages");
    values.push("Deploy Swarm Packages");
    values.push("Hibernate All Swarm Packages");
    values.push("Run Swarm Packages Locally");
  }

  values.push("New Package");

  if(typeof(swarmJson.packages) != "undefined" && swarmJson.packages.length > 0){
    // values.push("Edit Package");
    values.push("Remove Packages");
  }

  let sel;
  try{
    sel = await cliSelect({
      values: values,
      valueRenderer: (value, selected) => {
          if (selected) {
              return chalk.underline(value);
          }
          return value;
      },
    });

    if(sel.value == "Deploy All Swarm Packages"){
      deploySwarm();
    }
    else if(sel.value == "Deploy Swarm Packages"){
      deploySwarmPrepare();
    }
    else if(sel.value == "Hibernate All Swarm Packages"){
      hibernateCluster();
    }
    else if(sel.value == "New Package"){
      newPackage();
    }
    else if(sel.value == "New App"){
      newApp();
    }
    else if(sel.value == "Remove Apps"){
      removeApps();
    }
    else if(sel.value == "Remove Packages"){
      removePackages();
    }
    else if(sel.value == "Run Swarm Apps Locally"){
      runAppsLocal();
    }
    else if(sel.value == "Run Swarm Packages Locally"){
      runPackagesLocal();
    }
  }
  catch(error){
    selectProject();
  }
}


function isInArray(value, array) {
  return array.indexOf(value) > -1;
}


function delay(t, val = "") {
   return new Promise(function(resolve) {
       setTimeout(function() {
           resolve(val);
       }, t);
   });
}

async function deploySwarmPrepare(){

  logo();

  let choices = [];
  for(var i = 0; i < deployQueueJSON.length; i++) {
    choices.push({name:deployQueueJSON[i], value: deployQueueJSON[i]});
  }

  let prompt = new MultiSelect({
    name: 'value',
    message: 'Pick packages to deploy!',
    limit: deployQueueJSON.length,
    choices: choices
  });

  let choice;
  try{
    choice = await prompt.run();
    if(choice.length < 1){
      // console.log('You Chose Nothing!');
      await delay(2000);
      deploySwarmPrepare();

    }else{
      deploySwarm(choice);
    }
  }
  catch(error){
    welcome();
  }
}

async function deploySwarm(deployQueue = deployQueueJSON){

  let deployedList = [];

  let date_start = new Date();
  let timestamp_start = date_start.getTime();



  logo();


  for(var i = 0; i < swarmInfoQueue.length; i++) {

    if(typeof(swarmInfoQueue[i]['app']) != 'undefined' || (typeof(swarmInfoQueue[i]['scope']) == 'undefined' || swarmInfoQueue[i]['scope'] != 'global') && !isInArray(swarmInfoQueue[i]['package'],deployQueue)){ continue; }

    console.log("Copying swarm info for "+swarmInfoQueue[i]['package']+"...");

    try{
      let object = {};
      for(var i2 = 0; i2 < swarmInfoQueue[i]['objects'].length; i2++) {
        object[swarmInfoQueue[i]['objects'][i2]] = swarmJson[swarmInfoQueue[i]['objects'][i2]];
      }
      fs.writeFileSync(projectsRoot+projectFolder+'/'+swarmInfoQueue[i]['package']+'/swarm.json', JSON.stringify(object, null, 2));      // console.log(res.stdout + res.stderr);
    }
    catch(error){
      console.log("Copy Failed!");
      console.log(error);
    }


  }

  let retries=0;
  let runningQueue = [];
  let remainingQueue = [];
  for(var i = 0; i < deployQueue.length; i++) {
      runningQueue.push(deployQueue[i]);
  }

  while(runningQueue.length > 0 && retries<retrySettings.deploy){

        remainingQueue = [];
        for(var i = 0; i < runningQueue.length; i++) {
          console.log("Deploying "+runningQueue[i]+"...");
          try{
           let res = await exec("npm run deploy", {cwd: projectsRoot+projectFolder+"/"+runningQueue[i]});
           // console.log(res.stdout + res.stderr);
            deployedList.push(runningQueue[i]);
          }
          catch(error){
            console.log("Deploy Failed. Trying Later...");
            remainingQueue.push(runningQueue[i]);
          }
        }

        runningQueue = [];
        for(var i = 0; i < remainingQueue.length; i++) {
            runningQueue.push(remainingQueue[i]);
        }



        retries++;

  }



  let date_end = new Date();
  let timestamp_end = date_end.getTime();

  logo();
  console.log('Successfully Deployed '+deployedList.length+' Packages:');

  for(var i = 0; i < deployedList.length; i++) {
    console.log(deployedList[i]);
  }

  let timeInMinutes = timestamp_end-timestamp_start;
      timeInMinutes = timeInMinutes/60000;

  console.log('');
  console.log('Took '+timeInMinutes+' Minutes.');

}




async function deploySwarmPrepare(){


  logo();


  let choices = [];
  for(var i = 0; i < deployQueueJSON.length; i++) {
    choices.push({name:deployQueueJSON[i], value: deployQueueJSON[i]});
  }

  const prompt = new MultiSelect({
    name: 'value',
    message: 'Pick packages to deploy!',
    limit: deployQueueJSON.length,
    choices: choices
  });

  let choice;
  try{
    choice = await prompt.run();
    if(choice.length < 1){
      // console.log('You Chose Nothing!');
      await delay(2000);
      deploySwarmPrepare();

    }else{
      deploySwarm(choice);
    }
  }
  catch(error){
    welcome();
  }
}

async function hibernateCluster(deployQueue = deployQueueJSON){
  let deployedList = [];


  let date_start = new Date();
  let timestamp_start = date_start.getTime();



  logo();


  let retries=0;
  let runningQueue = [];
  let remainingQueue = [];
  for(var i = 0; i < deployQueue.length; i++) {
      runningQueue.push(deployQueue[i]);
  }

  while(runningQueue.length > 0 && retries<retrySettings.hibernate){
        remainingQueue = [];
        for(var i = 0; i < runningQueue.length; i++) {
          console.log("Hibernating "+runningQueue[i]+"...");
          try{
           let res = await exec("npm run hibernate", {cwd: projectsRoot+projectFolder+"/"+runningQueue[i]});
           // console.log(res.stdout + res.stderr);
            deployedList.push(runningQueue[i]);
          }
          catch(error){
            console.log("Hibernate Failed. Trying Later...");
            remainingQueue.push(runningQueue[i]);
          }
        }

        runningQueue = [];
        for(var i = 0; i < remainingQueue.length; i++) {
            runningQueue.push(remainingQueue[i]);
        }
        retries++;
  }



  let date_end = new Date();
  let timestamp_end = date_end.getTime();

  logo();
  console.log('Successfully Hibernated '+deployedList.length+' Packages:');

  for(var i = 0; i < deployedList.length; i++) {
    console.log(deployedList[i]);
  }

  let timeInMinutes = timestamp_end-timestamp_start;
      timeInMinutes = timeInMinutes/6000;

  console.log('');
  console.log('Took '+timeInMinutes+' Minutes.');

}


async function newPackage(){


    logo();

    let packagePrompt = new Input({
      message: 'What is the name for this package?',
      initial: 'myPackage'
    });
    let choice;
    try{
      choice = await packagePrompt.run();
    }
    catch(error){
      welcome();
      return false;
    }
    let newPackageName = choice;

    let projectSwarmJson = JSON.parse(fs.readFileSync(projectsRoot+projectFolder+'/swarm.json'));      // console.log(res.stdout + res.stderr);
    if(typeof(projectSwarmJson['packages']) == 'undefined'){
      projectSwarmJson['packages'] = [];
    }

    projectSwarmJson['packages'].push(newPackageName);

    console.log("Creating Package...");
    fs.mkdirSync(projectsRoot+projectFolder+"/"+newPackageName);
    fs.writeFileSync(projectsRoot+projectFolder+'/swarm.json', JSON.stringify(projectSwarmJson, null, 2));      // console.log(res.stdout + res.stderr);
    await delay(1000);
    setProject(projectFolder, projectSwarmJson);
    welcome();


}




async function newApp(){


    logo();

    let packagePrompt = new Input({
      message: 'What is the name for this app?',
      initial: 'myApp'
    });
    let choice;
    try{
      choice = await packagePrompt.run();
    }
    catch(error){
      welcome();
      return false;
    }
    let newPackageName = choice;

    let projectSwarmJson = JSON.parse(fs.readFileSync(projectsRoot+projectFolder+'/swarm.json'));      // console.log(res.stdout + res.stderr);
    if(typeof(projectSwarmJson['apps']) == 'undefined'){
      projectSwarmJson['apps'] = [];
    }

    projectSwarmJson['apps'].push({name: newPackageName, folder: newPackageName, local: "npm run web"});

    console.log("Creating App...");
    fs.mkdirSync(projectsRoot+projectFolder+"/"+newPackageName);
    fs.writeFileSync(projectsRoot+projectFolder+'/swarm.json', JSON.stringify(projectSwarmJson, null, 2));      // console.log(res.stdout + res.stderr);
    await delay(1000);
    setProject(projectFolder, projectSwarmJson);
    welcome();


}



async function removePackages(){

  logo();


  let choices = [];
  for(var i = 0; i < deployQueueJSON.length; i++) {
    choices.push({name:deployQueueJSON[i], value: deployQueueJSON[i]});
  }

  let prompt = new MultiSelect({
    name: 'value',
    message: 'Pick packages to remove!',
    limit: deployQueueJSON.length,
    choices: choices
  });

  let choice;
  try{
    choice = await prompt.run();
    if(choice.length < 1){
      // console.log('You Chose Nothing!');
      await delay(2000);
      removePackages();

    }else{
        //remove the choices from drive
      let newPackages = [];
      let packages = swarmJson.packages;
      for(var i = 0; i < packages.length; i++) {
        if(isInArray(packages[i],choice)){
          console.log("Removing "+packages[i]+"...");
          fs.rmdirSync(projectsRoot+projectFolder+"/"+packages[i]);
          await delay(1000);

          console.log("Removing "+packages[i]+" from swarm info...");
          await delay(1000);

        }
        else{
          newPackages.push(packages[i]);
        }
      }
      swarmJson.packages = newPackages;
      fs.writeFileSync(projectsRoot+projectFolder+'/swarm.json', JSON.stringify(swarmJson, null, 2));      // console.log(res.stdout + res.stderr);
      await delay(1000);
      setProject(projectFolder,swarmJson);
      await delay(1000);
      welcome();
    }
  }
  catch(error){
    // console.log(error);
    welcome();
    return false;
  }
}



async function removeApps(){

  logo();


  let choices = [];
  for(var i = 0; i < swarmJson.apps.length; i++) {
    choices.push({name:swarmJson.apps[i]['name'], value: swarmJson.apps[i]['folder']});
  }

  let prompt = new MultiSelect({
    name: 'value',
    message: 'Pick apps to remove!',
    limit: deployQueueJSON.length,
    choices: choices
  });

  let choice;
  try{
    choice = await prompt.run();
    if(choice.length < 1){
      // console.log('You Chose Nothing!');
      await delay(2000);
      removePackages();

    }else{
        //remove the choices from drive
      let newPackages = [];
      let packages = swarmJson.apps;
      for(var i = 0; i < packages.length; i++) {
        if(isInArray(packages[i]['folder'],choice)){
          console.log("Removing "+packages[i]['name']+"...");
          fs.rmdirSync(projectsRoot+projectFolder+"/"+packages[i]['folder']);
          await delay(1000);

          // // console.log("Removing "+packages[i]['name']+" from swarm info...");
          // await delay(1000);

        }
        else{
          newPackages.push(packages[i]);
        }
      }
      swarmJson.apps = newPackages;
      fs.writeFileSync(projectsRoot+projectFolder+'/swarm.json', JSON.stringify(swarmJson, null, 2));      // console.log(res.stdout + res.stderr);
      await delay(1000);
      setProject(projectFolder,swarmJson);
      await delay(1000);
      welcome();
    }
  }
  catch(error){
    // console.log(error);
    welcome();
    return false;
  }
}


async function runPackagesLocal(){

  let deployedList = [];

  console.clear();
  console.log(
    chalk.yellow(
      figlet.textSync(cliName, { horizontalLayout: 'full' })
    )
  );


  let choices = [];

  for(var i = 0; i < swarmJson.packages.length; i++) {
    choices.push({name:swarmJson.packages[i], value: swarmJson.packages[i]});
  }

  let prompt = new MultiSelect({
    name: 'value',
    message: 'Pick packages to run locally!',
    limit: swarmJson.packages.length,
    choices: choices
  });

  let choice;
  try{
    choice = await prompt.run();
    if(choice.length < 1){
      // console.log('You Chose Nothing!');
      await delay(2000);
      runPackagesLocal();

    }else{
        //remove the choices from drive
        let retries=0;
        let runningQueue = [];
        let remainingQueue = [];
        for(var i = 0; i < choice.length; i++) {
            runningQueue.push(choice[i]);
        }


          for(var i = 0; i < swarmInfoQueue.length; i++) {

            if(typeof(swarmInfoQueue[i]['app']) != 'undefined' || (typeof(swarmInfoQueue[i]['scope']) == 'undefined' || swarmInfoQueue[i]['scope'] != 'global') && typeof(swarmInfoQueue[i]['package']) != 'undefined' && !isInArray(swarmInfoQueue[i]['package'],runningQueue)){ continue; }

            console.log("Copying swarm info for "+swarmInfoQueue[i]['package']+"...");

            try{
              let object = {};
              for(var i2 = 0; i2 < swarmInfoQueue[i]['objects'].length; i2++) {
                object[swarmInfoQueue[i]['objects'][i2]] = swarmJson[swarmInfoQueue[i]['objects'][i2]];
              }
              fs.writeFileSync(projectsRoot+projectFolder+'/'+swarmInfoQueue[i]['package']+'/swarm.json', JSON.stringify(object, null, 2));      // console.log(res.stdout + res.stderr);
            }
            catch(error){
              console.log("Copy Failed!");
              console.log(error);
            }


          }


        // console.log(runningQueue);
        while(runningQueue.length > 0 && retries<retrySettings.deploy){

              remainingQueue = [];
              for(var i = 0; i < runningQueue.length; i++) {
                console.log("Starting "+runningQueue[i]+"...");
                try{
                  let folder = projectsRoot+projectFolder+"/"+runningQueue[i];
                  let res = spawn('npm run start', { stdio: 'inherit', shell: true, cwd: folder});
                  // console.log(res.stdout + res.stderr);
                  deployedList.push(runningQueue[i]);
                }
                catch(error){
                  console.log("Starting Failed. Trying Later...");
                  remainingQueue.push(runningQueue[i]);
                }
              }

              runningQueue = [];
              for(var i = 0; i < remainingQueue.length; i++) {
                  runningQueue.push(remainingQueue[i]);
              }



              retries++;

        }



        // let date_end = new Date();
        // let timestamp_end = date_end.getTime();
        //
        // // console.clear();
        // console.log(
        //   chalk.yellow(
        //     figlet.textSync(cliName, { horizontalLayout: 'full' })
        //   )
        // );
        // console.log('Successfully Deployed '+deployedList.length+' Packages:');
        //
        // for(var i = 0; i < deployedList.length; i++) {
        //   console.log(deployedList[i]);
        // }
        //
        // let timeInMinutes = timestamp_end-timestamp_start;
        //     timeInMinutes = timeInMinutes/60000;
        //
        // console.log('');
        // console.log('Took '+timeInMinutes+' Minutes.');

    }
  }
  catch(error){
    // console.log(error);
    // welcome();
    return false;
  }



}


async function runAppsLocal(){

  let deployedList = [];

  logo();


  let choices = [];

  for(var i = 0; i < swarmJson.apps.length; i++) {
    choices.push({name:swarmJson.apps[i].name, value: swarmJson.apps[i].folder});
  }

  let prompt = new MultiSelect({
    name: 'value',
    message: 'Pick apps to run locally!',
    limit: swarmJson.apps.length,
    choices: choices
  });

  let choice;
  try{
    choice = await prompt.run();
    if(choice.length < 1){
      // console.log('You Chose Nothing!');
      await delay(2000);
      runAppsLocal();

    }else{


        //remove the choices from drive
        let retries=0;
        let runningQueue = [];
        let remainingQueue = [];
        for(var i = 0; i < choice.length; i++) {
          for(var i2 = 0; i2 < swarmJson.apps.length; i2++) {
            if(choice[i] == swarmJson.apps[i2].name){
              runningQueue.push(swarmJson.apps[i2]);
            }
          }
        }
        let runningQueueFolders = [];
        for(var i = 0; i < choice.length; i++) {
          for(var i2 = 0; i2 < swarmJson.apps.length; i2++) {
            if(choice[i] == swarmJson.apps[i2].name){
              runningQueueFolders.push(swarmJson.apps[i2]['folder']);
            }
          }
        }

        for(var i = 0; i < swarmInfoQueue.length; i++) {

          if( (typeof(swarmInfoQueue[i]['app']) == 'undefined' && typeof(swarmInfoQueue[i]['package']) != 'undefined') || !isInArray(swarmInfoQueue[i]['folder'],runningQueueFolders) ){ continue; }

          console.log("Copying swarm info for "+swarmInfoQueue[i]['app']+"...");

          try{
            let object = {};
            for(var i2 = 0; i2 < swarmInfoQueue[i]['objects'].length; i2++) {
              object[swarmInfoQueue[i]['objects'][i2]] = swarmJson[swarmInfoQueue[i]['objects'][i2]];
            }
            fs.writeFileSync(projectsRoot+projectFolder+'/'+swarmInfoQueue[i]['folder']+'/src/app/swarm.json', JSON.stringify(object, null, 2));      // console.log(res.stdout + res.stderr);
          }
          catch(error){
            console.log("Copy Failed!");
            console.log(error);
          }


        }



          for(var i = 0; i < swarmInfoQueue.length; i++) {

            if((typeof(swarmInfoQueue[i]['app']) != 'undefined' || typeof(swarmInfoQueue[i]['scope']) == 'undefined') || !isInArray(swarmInfoQueue[i]['scope'], runningQueueFolders)){ continue; }

            console.log("Copying swarm info for "+swarmInfoQueue[i]['package']+"...");

            try{
              let object = {};
              for(var i2 = 0; i2 < swarmInfoQueue[i]['objects'].length; i2++) {
                object[swarmInfoQueue[i]['objects'][i2]] = swarmJson[swarmInfoQueue[i]['objects'][i2]];
              }
              fs.writeFileSync(projectsRoot+projectFolder+'/'+swarmInfoQueue[i]['package']+'/swarm.json', JSON.stringify(object, null, 2));      // console.log(res.stdout + res.stderr);
            }
            catch(error){
              console.log("Copy Failed!");
              console.log(error);
            }


          }




        // console.log(runningQueue);
        while(runningQueue.length > 0 && retries<retrySettings.deploy){

              remainingQueue = [];
              for(var i = 0; i < runningQueue.length; i++) {
                console.log("Starting "+runningQueue[i].name+"...");
                try{
                  let folder = projectsRoot+projectFolder+"/"+runningQueue[i].folder;
                 let res = spawn(runningQueue[i].local, { stdio: 'inherit', shell: true, cwd: folder});
                  // console.log(res.stdout + res.stderr);
                  deployedList.push(runningQueue[i]);
                }
                catch(error){
                  console.log("Starting Failed. Trying Later...");
                  remainingQueue.push(runningQueue[i]);
                }
              }

              runningQueue = [];
              for(var i = 0; i < remainingQueue.length; i++) {
                  runningQueue.push(remainingQueue[i]);
              }



              retries++;

        }



        let date_end = new Date();
        let timestamp_end = date_end.getTime();

        // console.clear();
        // console.log(
        //   chalk.yellow(
        //     figlet.textSync(cliName, { horizontalLayout: 'full' })
        //   )
        // );
        // console.log('Successfully Deployed '+deployedList.length+' Packages:');
        //
        // for(var i = 0; i < deployedList.length; i++) {
        //   console.log(deployedList[i]);
        // }
        //
        // let timeInMinutes = timestamp_end-timestamp_start;
        //     timeInMinutes = timeInMinutes/60000;
        //
        // console.log('');
        // console.log('Took '+timeInMinutes+' Minutes.');

    }
  }
  catch(error){
    // console.log(error);
    // welcome();
    return false;
  }
}
