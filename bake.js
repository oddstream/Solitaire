//@ts-check
'use strict';

const fs = require('fs');

const GUTS_PATTERN = /\.guts$/;

/**
 * Copy fname to dst fname iff fname is newer than dst fname
 * @param {string} fname 
 * @param {string} dst 
 */
function xcopy(fname, dst) {
}

function buildHtml(htmlFile, gutsFile) {
}

function buildGutsList() {
  let gutsList = [];

  if ( process.argv.length === 3 && GUTS_PATTERN.test(process.argv[2]) ) {
    gutsList.push(process.argv[2]);
  } else {
    let items = fs.readdirSync('build');
    items.forEach( f => {
      if ( GUTS_PATTERN.test(f) ) {
        gutsList.push(f);
      } 
    });
  }

  return gutsList;
}

function getModifiedTime(fname) {
  const s = fs.statSync(fname);
  return new Date(s.mtime).getTime();
}

buildGutsList().forEach( gutsFile => {
  const htmlFile = gutsFile.replace(GUTS_PATTERN, '.html');
  let updateHtml = false;
  if ( fs.existsSync(htmlFile) ) {
    const htmlTime = getModifiedTime(htmlFile);
    ['header.txt', gutsFile, 'symbols.svg', 'footer.txt'].forEach( fname => {
      if ( getModifiedTime('build\\'+fname) > htmlTime ) {
        console.log(htmlFile, 'needs updating because of', fname);
        updateHtml = true;
      }
    });
  } else {
    console.log(htmlFile, 'does not exist');
    updateHtml = true;
  }
  if ( updateHtml ) {
    buildHtml(htmlFile, gutsFile);
  }
});
