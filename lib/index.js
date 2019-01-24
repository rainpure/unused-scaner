const ora = require('ora');
const path = require('path');
const yargs = require('yargs');
const chalk = require('chalk');
const scaner = require('./scaner');
const { filesReport, imagesReport, dependenciesReport } = require('./reporter');

// 从命令行接收参数
const argv = yargs.argv;
const {
    scanFolder,
    remove,
} = argv;

if (!scanFolder) {
  process.stderr.write('请输入参数 --scanFolder\n');
  process.exit(1);
}

const projectRoot = path.resolve(scanFolder);
// const {
//     scanFolder: relativeRoot = process.cwd(),
//     remove,
// } = argv;
// const projectRoot = path.resolve(relativeRoot);
const manifest = require(path.join(projectRoot, 'package.json')); // find package.json
const spinner = ora('废弃资源检测中').start();
console.time('检测无用资源耗时');

(async () => {
    const {
        allFilesList,
        usedFiles,
        wasteRes,
        usedDependencies
    } = await scaner(projectRoot); // find usedFiles, usedDependencies
    const unusedDependencies = [
        ...Object.keys(manifest.dependencies || {}),
    ].filter(item => !usedDependencies[item]);
    // const unusedFiles = allFilesList.map(files => files.filter(filePath => !usedFiles[path.join(projectRoot, filePath)]));
    spinner.text = '检测完成';
    spinner.succeed()
    console.timeEnd('检测无用资源耗时');
    dependenciesReport(unusedDependencies);
    imagesReport(projectRoot, scanFolder, wasteRes);

    if (remove) {
        process.stdout.write(
            chalk.green(`\n🔥 I want to delete !\n`),
        );
    }
})();