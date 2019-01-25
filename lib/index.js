const ora = require('ora');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const yargs = require('yargs');
const fs = require('fs');
const scaner = require('./scaner');
const { filesReport, imagesReport, dependenciesReport } = require('./reporter');

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
const manifest = require(path.join(projectRoot, 'package.json')); // find package.json
const spinner = ora('废弃资源检测中').start();
console.time('检测无用资源耗时');

(async () => {
    const {
        allFilesList,
        usedFiles,
        wasteRes,
        usedDependencies
    } = await scaner(projectRoot);
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
        const rlquestion = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rlquestion.question('是否删除所有未引用图片资源？y/n：', (answer) => {
            if (answer === 'y') {
                // 删除文件
                const spinnerDelete = ora('Deleting').start();
                wasteRes.forEach(img => {
                    fs.unlink(`${img.path}/${img.filename}`, (err) => {
                        if (err) {
                            spinnerDelete.fail();
                            throw err;
                        }
                    });
                });
                spinnerDelete.text = '🔥删除废弃图片资源成功';
                spinnerDelete.succeed();
                rlquestion.close();
            } else {
                process.stdout.write(chalk.green('\n    不，我不想\n'));
            }
            rlquestion.close();
        });
    }
})();