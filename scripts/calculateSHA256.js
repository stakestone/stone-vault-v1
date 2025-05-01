const fs = require('fs');
const crypto = require('crypto');

function calculateSHA256(filePath) {
    // 创建一个 SHA-256 哈希对象
    const hash = crypto.createHash('sha256');

    // 读取文件并更新哈希
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('data', (chunk) => {
        hash.update(chunk);
    });

    fileStream.on('end', () => {
        // 输出 SHA-256 校验和
        console.log(`SHA-256 Checksum: ${hash.digest('hex')}`);
    });

    fileStream.on('error', (err) => {
        console.error(`Error reading file: ${err}`);
    });
}

// 替换为你的 CSV 文件路径
const csvFilePath = '/Users/mingyuzhang/Downloads/allocation_noBufferKept_v1.csv';
calculateSHA256(csvFilePath);
