const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const rootPackagePath = path.join(rootDir, 'package.json');
const appPackagePath = path.join(rootDir, 'release', 'app', 'package.json');
const appLockPath = path.join(rootDir, 'release', 'app', 'package-lock.json');

const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
const appPackage = JSON.parse(fs.readFileSync(appPackagePath, 'utf8'));

appPackage.name = rootPackage.name;
appPackage.version = rootPackage.version;
appPackage.description = rootPackage.description;
appPackage.author = rootPackage.author;
appPackage.license = rootPackage.license;

fs.writeFileSync(appPackagePath, `${JSON.stringify(appPackage, null, 2)}\n`);

if (fs.existsSync(appLockPath)) {
  const appLock = JSON.parse(fs.readFileSync(appLockPath, 'utf8'));
  appLock.name = rootPackage.name;
  appLock.version = rootPackage.version;

  if (appLock.packages && appLock.packages['']) {
    appLock.packages[''].name = rootPackage.name;
    appLock.packages[''].version = rootPackage.version;
    appLock.packages[''].license = rootPackage.license;
  }

  fs.writeFileSync(appLockPath, `${JSON.stringify(appLock, null, 2)}\n`);
}
