"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const lolfi_1 = require("lolfi");
const wait_for_expect_1 = __importDefault(require("wait-for-expect"));
const files_1 = require("../../src/modules/framework/files");
const is_defined_1 = require("../../src/utils/is-defined");
async function createSession(options) {
    const sessionId = options.session.id || (0, node_crypto_1.randomInt)(100, 1e6);
    const sessionName = `${options.session.name || 'Transparence annuelle'}`;
    const archive = await (0, lolfi_1.generateLolfiArchive)({
        sessions: [{ ...options.session, name: sessionName, id: sessionId }],
    });
    const ingestionResponse = await options.http
        .post('/api/ingest/v1/lolfi')
        .set({ cookie: options.cookie })
        .attach('file', archive, {
        filename: 'LOLFI_CSM_' + new Date().toISOString() + `.zip`,
        contentType: files_1.FILE_MIME_TYPES.zip,
    })
        .expect(common_1.HttpStatus.OK);
    const { id: jobId } = ingestionResponse.body;
    await (0, wait_for_expect_1.default)(async () => {
        const jobResponse = await options.http
            .get(`/api/jobs/v1/${jobId}`)
            .set({ cookie: options.cookie })
            .expect(common_1.HttpStatus.OK);
        const status = jobResponse.body.status;
        if (status === 'FAILED') {
            console.error(jobResponse.body.errors);
            console.error(jobResponse.body.files.map((file) => file.errors));
            expect(status).toBe('FAILED');
        }
        expect(status).toBe('SUCCEEDED');
    }, 2_000);
    const sessionResponse = await options.http
        .get('/api/sessions/v2/garde-des-sceaux')
        .query({ search: `${sessionName} (${sessionId})` })
        .set({ cookie: options.cookie })
        .expect(common_1.HttpStatus.OK);
    return { id: (0, is_defined_1.assertIsDefined)(sessionResponse.body.items[0], `unknown session "${sessionName}"`).id };
}
//# sourceMappingURL=lolfi.js.map