// This module's rename function is called from thelocalworkflow.js
// It depends on the "Clip" and "Shoot" object constructors (found in workflowobjects.js)

var fs = require("fs");
var path = require("path");
const Clip = require("./workflowobjects").Clip;
const Shoot = require("./workflowobjects").Shoot;


// var result = rename(folderToTest);
// console.log(JSON.stringify(result));

function rename(folderPath) {
  // regex to cope with hidden files
  var re = /^\./;
  var re2 = /.txt$/;
  var re3 = /.fcpxml$/;
  var re4 = /.json$/;
  // construct new Shoot object using the Shoot object constructor we required from workflowobjects
  var thisShoot = new Shoot(folderPath);
  // start arrays for clips and cameras that we'll add to as we loop through the folders and files
  var theseClipObjects = [];
  var cameraArray = [];
  // get list of folders
  var folders = fs.readdirSync(folderPath);
  folders.forEach(function(camFolder){
    // check if this is actually a folder, if so, push folder's name as a camera to .cameraArray and start looping files in it
    if (fs.statSync(path.join(folderPath,camFolder)).isDirectory()) {
      //put loop that checks for video files here!!
      thisShoot.cameraArray.push(camFolder);
      // introducing this offset to make sure that we don't count hidden files when enumerating to get the file names.
      // there is probably a better way to do this
      var offsetForIndex = 0;
      fs.readdirSync(path.join(folderPath,camFolder)).forEach(function(file, index) {
        if (re.test(file) || re2.test(file) || re3.test(file) || re4.test(file)) {
          // if this is a hidden file, don't bother with it, but increment that offset so that we don't misnumber the actual clip files
          offsetForIndex++;
        }
        else {
          // if this isn't a hidden file, create a new Clip object using the Clip constructor we brought in from workflowobjects.js.
          // this constructor takes the whole path in chunks plus that counter we're calculating with the offsetForIndex
          var thisClip = new Clip(folderPath, camFolder, path.basename(file), (index - offsetForIndex));
          // add the clip to the array of clip objects
          theseClipObjects.push(thisClip);
          // TODO: toggle this on and off to avoid renaming while testing:
          fs.renameSync(thisClip.oldPath, thisClip.newPath);
        }
      });
    }
    else {
    }
  });
  // store theseClipObjects array in thisShoot.clipArray
  thisShoot.clipArray = theseClipObjects;
  // create shootNotes by looping through all clips and logging old name and new name.
  shootNotes=("Log of renaming operations for " + thisShoot.shootId + ":\n");
  thisShoot.clipArray.forEach(function(clip, index){
    shootNotes=(shootNotes+(index+1)+". Renamed " + clip.oldBasenameExt + " to " + clip.newBasenameExt + "\n" )
  });
  // find the first clip by CLOCK time stored in creation_time
  var minUtcCrStartMillTs = Math.min.apply(Math,thisShoot.clipArray.map(function(o){return o.utcTcStartMill;}));
  // find the clip that has this start time and define it as thisShoot's startClip
  thisShoot.startClip = thisShoot.clipArray.find(function(o){ return o.utcTcStartMill == minUtcCrStartMillTs; })
  // find the very first clip in start_ts terms (this is important for fcpx)
  var minStartTs = Math.min.apply(Math,thisShoot.clipArray.map(function(o){return o.start_ts;}));
  thisShoot.tsStartClip = thisShoot.clipArray.find(function(o){ return o.start_ts == minStartTs; });
  var maxEndTs = Math.max.apply(Math,thisShoot.clipArray.map(function(o){return o.end_ts;}));
  thisShoot.firstMcAngle = thisShoot.startClip.cameraFolder;
  // TODO: change at some point to cope with clock-time differential.
  thisShoot.mcStartTc = thisShoot.startClip.startTc;
  thisShoot.mcStartTs = minStartTs;
  thisShoot.mcEndTs = maxEndTs;
  thisShoot.totalDurationTs = 0;
  thisShoot.totalDuration = 0;
  // loop through clip array and count total duration of footage
  thisShoot.clipArray.forEach(function(clip){
    thisShoot.totalDurationTs += clip.duration_ts;
    thisShoot.totalDuration += parseFloat(clip.duration);
  });
  console.log("total duration_ts is " + thisShoot.totalDurationTs);
  console.log("total duration is " + thisShoot.totalDuration);
  secondsFromDurationTs = (thisShoot.totalDurationTs/(24000));
  console.log("equiv of duration_ts in seconds is" + secondsFromDurationTs);
  // determine MC duration, which is also shoot duration
  thisShoot.mcDuration = thisShoot.mcEndTs - thisShoot.mcStartTs;
  console.log(("and this shoot's mcDur is " + thisShoot.mcDuration));
  thisShoot.startCrDate = thisShoot.startClip.creationDate;
  thisShoot.startTcDate = thisShoot.startClip.utcTcStartDate;
  thisShoot.tcOffset = thisShoot.startTcDate.getTime() - thisShoot.startCrDate.getTime();
  thisShoot.tcFramesOffset = (thisShoot.tcOffset*24)/1001;
  notesFolderPath=("/" + path.join(folderPath, "_notes"));
  // if (fs.existsSync(notesFolderPath)) {
  // }
  // else {
  //   fs.mkdirSync(notesFolderPath);
  // }
  // shootNotesName=(thisShoot.shootId + "_shootnotes.txt")
  // shootNotesPath=path.join(folderPath, "_notes", shootNotesName)
  // fs.appendFile(shootNotesPath, ("\n\n" + shootNotes), function (err) {
  //   if (err) {
  //     // console.log("didn't work");
  //   } else {
  //   }
  // })
  return thisShoot;
}

module.exports.rename = rename;
