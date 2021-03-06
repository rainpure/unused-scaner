const fs = require('fs');
const importRegex = /from '(.*)'/g;
const requireRegex = /require\('(.*)'\)/g;
const graphqlImportRegex = /#import '(.*)'/g;
const SUFFIX = ['html', 'phtml', 'js', 'css', 'less', 'scss', 'sass', 'vue', 'jsx']; // 需要加入检测的文件后缀
const SUFFIX_IMG = ['png', 'jpg', '.jpeg', 'swf', 'gif']; // 图片格式后缀
const IGNORE_FILE = ['__build', 'node_modules', 'dist', '.git', 'build_scripts', 'Moxie.cdn.swf', '.DS_Store', 'Gruntfile.js', '.eslintrc.js'];
const IGNORE_FOLDER = []; // 需要过滤某个文件夹，但不过滤其他文件夹下同名文件
let fileContent = [];
let allFilesList = [];
let usedFiles = [];
let wasteRes = [];
const usedDependencies = {};

/**
 * 符合规则的资源不加入比对（白名单）
 * @param {String} files 检测的文件/文件夹名称
 */
function ignores(files) {
    return files.filter(file => IGNORE_FILE.indexOf(file) < 0);
}

// 获取目录中的所有文件
function readFileList(path) {
    let files = ignores(fs.readdirSync(path)); // 读取一个目录中的所有文件
    files.forEach((itm) => {
        let stat = fs.statSync(`${path}/${itm}`);
        if (stat.isDirectory()) {
            if (IGNORE_FOLDER.indexOf(itm) < 0) {
                readFileList(`${path}/${itm}`); // 递归读取文件
            }
        } else {
            allFilesList.push({
                path: path,
                filename: itm
            });
            // allFilesList.push(`${path}/${itm}`);
        }
    });
    return allFilesList;
}
// 获取文件后缀
function getFileSuffix(filePath) {
    let startIndex = filePath.lastIndexOf('.');
    if (startIndex != -1)
        return filePath.substring(startIndex + 1, filePath.length).toLowerCase();
    else return '';
}

/**
 * 返回指定格式的文件
 * @param {Array} files 原始文件
 * @param {Array} suffix 后缀
 */
function getSpecFileList(files, suffix) {
    let fileArr = [];
    files.forEach(file => {
        if (suffix.indexOf(getFileSuffix(file.filename)) > -1) {
            fileArr.push({
                path: file.path,
                filename: file.filename
            });
        }
    });
    return fileArr;
}

/**
 * 获取图片匹配路径，当前匹配规则：上一级目录/文件名
 * @param {Object} obj 图片对象，格式 { path: '', filename: '' }
 */
function getMatchPath(obj) {
    let path = obj.path.split('/');
    let matchPath = `${path[path.length - 1]}/${obj.filename}`;
    return matchPath;
}

/**
 * 读取文件内容
 * @param {Array} retrievedFiles 被遍历的文件路径
 */
function getFilesContent(retrievedFiles) {
    const commentRegex = /\/\/.*|\/\*.*\*\//g; // 匹配注释
    retrievedFiles.forEach((file, x) => {
        fileContent[x] = fs
            .readFileSync(`${file.path}/${file.filename}`, {
                encoding: 'utf8'
            })
            .replace(commentRegex, '');
    });
}

// 包含图片引用的内容
function getUrlContens() {
    let rReg = new RegExp("(from '(.*)')|(\'background\':.*)|(url(.*))|(src=(.*))|attr\('src',(.*)\)|(\'background-image\':.*)", 'g');
    let urlContents = fileContent.join('FILEEND\n\r').match(rReg);
    return urlContents;
}

async function getWasteRes() {
    let urlContents = await getUrlContens();
    let imageList = getSpecFileList(allFilesList, SUFFIX_IMG); // 获取文件夹下的所有图片
    imageList.forEach(img => {
        let matchPath = getMatchPath(img);
        if (`${urlContents}`.indexOf(matchPath) > -1 && usedFiles.indexOf(matchPath) === -1) {
            usedFiles.push(matchPath);
        }
    });
    // 输出最终结果
    wasteRes = imageList.filter(img => usedFiles.indexOf(getMatchPath(img)) < 0);
    return wasteRes;
}

// 获取引用的依赖
function getDependencies() {
    // const founds = []; // 被引用的文件
    let found = importRegex.exec(fileContent);
    while (found) {
        if (found[1][0] === '.') {
            // founds.push(found[1]);
        } else {
            const splits = found[1].split('/');
            usedDependencies[
                found[1][0] === '@' ? splits.slice(0, 2).join('/') : splits[0]
            ] = true;
        }
        found = importRegex.exec(fileContent);
    }

    found = requireRegex.exec(fileContent);
    while (found) {
        if (found[1][0] === '.') {
            // founds.push(found[1]);
        } else {
            const splits = found[1].split('/');
            usedDependencies[
                found[1][0] === '@' ? splits.slice(0, 2).join('/') : splits[0]
            ] = true;
        }
        found = requireRegex.exec(fileContent);
    }

    found = graphqlImportRegex.exec(fileContent);
    while (found) {
        //   founds.push(found[1]);
        found = graphqlImportRegex.exec(fileContent);
    }
    return usedDependencies;
}

module.exports = async function (projectRoot) {
    await readFileList(projectRoot);
    scanFileList = getSpecFileList(allFilesList, SUFFIX); // 获取文件夹下需要扫描的文件
    await getFilesContent(scanFileList); // 读取文件内容
    getDependencies();
    await getWasteRes();
    return {
        allFilesList: allFilesList,
        usedFiles: usedFiles,
        wasteRes: wasteRes,
        usedDependencies: usedDependencies,
    }
};