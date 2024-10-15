"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NESTIA_CONFIG = void 0;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
exports.NESTIA_CONFIG = {
    input: async () => {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        return app;
    },
    clone: true,
    swagger: {
        output: 'dist/swagger.json',
    },
    output: '../../packages/api-sdk/generated',
    assert: true,
};
exports.default = exports.NESTIA_CONFIG;
//# sourceMappingURL=nestia.config.js.map