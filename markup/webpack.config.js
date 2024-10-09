const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const ejsDirectory = path.resolve(__dirname, "src", "ejs");

/**
 * src/ejs/ 以下のすべての .ejs ファイルを再帰的に取得し、
 * HtmlWebpackPlugin のインスタンスを動的に生成する関数
 */
function generateHtmlPlugins(templateDir) {
    const templateFiles = [];
    
    // 再帰的にディレクトリを読み込み、EJSファイルを取得
    function readDirectory(directory) {
        const files = fs.readdirSync(directory);
        files.forEach((file) => {
            const filePath = path.join(directory, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                readDirectory(filePath);
            } else if (file.endsWith(".ejs")) {
                const relativePath = path.relative(ejsDirectory, filePath);
                const name = relativePath.replace(/\.ejs$/, ""); // 拡張子を取り除く
                templateFiles.push({ name, filePath });
            }
        });
    }

    readDirectory(templateDir);

    // 各EJSファイルに対応する HtmlWebpackPlugin を生成
    return templateFiles.map((file) => {
        return new HtmlWebpackPlugin({
            template: file.filePath,
            filename: `${file.name}.html`,  // ファイル名として出力 (ディレクトリ構造を保持)
            minify: {
                collapseWhitespace: true,
                preserveLineBreaks: true,
            },
            title: file.name.split('/').pop(),  // ファイル名からタイトルを推測
        });
    });
}

module.exports = function () {
    return {
        mode: "development",

        entry: path.resolve(__dirname, "src", "js", "index.js"), // エントリーポイント

        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "main.js",  // 出力されるJavaScriptファイル
        },

        module: {
            rules: [
                {
                    test: /\.ejs$/,  // EJSファイルを対象にする
                    use: [
                        "html-loader",
                        "template-ejs-loader",
                    ],
                },
            ]
        },

        plugins: [
            ...generateHtmlPlugins(ejsDirectory), // 自動的に生成された HtmlWebpackPlugin のリスト
        ],

        devServer: {
            static: {
                directory: path.join(__dirname, 'src'),
            },
            compress: true,  // gzip圧縮を有効化
            port: 9000,  // サーバーが使用するポート番号
            open: true,  // ブラウザで自動的にページを開く
            hot: true,  // ホットリロードを有効化
            liveReload: true,  // ファイル変更時に自動でリロード
        },
    };
};
