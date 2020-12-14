const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    webpack: function override(config, env) {
        // Make file-loader ignore WASM files
        const wasmExtensionRegExp = /\.wasm$/;
        config.resolve.extensions.push('.wasm');
        config.module.rules.forEach(rule => {
            (rule.oneOf || []).forEach(oneOf => {
                if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
                    oneOf.exclude.push(wasmExtensionRegExp);
                }
            });
        });

        // Make url-loader handle DB files
        config.resolve.extensions.push('.db');
        config.module.rules.forEach(rule => {
            (rule.oneOf || []).shift({
                test: [/\.db$/],
                loader: require.resolve('url-loader'),
                options: {
                    mimetype: 'application/octet-stream',
                    name: 'static/media/[name].[hash:8].[ext]',
                },
            })
        });


        config.plugins.push(new CopyPlugin({
            patterns: [
                { from: './sql-wasm-json1.wasm', to: 'static/js/sql-wasm.wasm' }
            ]
        }));
     
        return config;
    }
}