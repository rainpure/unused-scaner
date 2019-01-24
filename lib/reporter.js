const path = require('path');
const chalk = require('chalk');

const filesReport = function () {
    console.log(123);
}

const imagesReport = function (projectRoot, scanFolder, wasteRes) {
    if (!wasteRes.length) {
        process.stdout.write(chalk.green('\n✅ No unused images found.\n'));
        return;
    }
    process.stdout.write(
        chalk.red(
            `\n❌ ${wasteRes.length} unused images found.\n`,
        ),
    );
    process.stdout.write(chalk.blue(`● ${scanFolder}\n`));
    wasteRes.forEach((files) => {
        process.stdout.write(chalk.yellow(`    • ${files.path.slice(projectRoot.length)}/${files.filename}\n`));
    });
}

const dependenciesReport = function (unusedDependencies) {
    if (!unusedDependencies.length) {
        process.stdout.write(chalk.green('\n✅ No unused dependencies found.\n'));
        return;
    }
    process.stdout.write(
        chalk.red(
            `\n❌ ${unusedDependencies.length} unused dependencies found.\n`,
        ),
    );
    unusedDependencies.forEach(dep => process.stdout.write(chalk.yellow(`    • ${dep}\n`)));
};


module.exports.dependenciesReport = dependenciesReport;
module.exports.imagesReport = imagesReport;