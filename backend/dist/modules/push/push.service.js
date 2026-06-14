"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToUser = sendPushToUser;
const web_push_1 = __importDefault(require("web-push"));
const prisma_1 = require("../../config/prisma");
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    web_push_1.default.setVapidDetails('mailto:techchurras@gmail.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}
async function sendPushToUser(userId, title, body, url = '/orders') {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY)
        return;
    const subs = await prisma_1.prisma.pushSubscription.findMany({ where: { userId } });
    if (!subs.length)
        return;
    const stale = [];
    await Promise.all(subs.map(sub => web_push_1.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify({ title, body, url })).catch((err) => {
        if (err.statusCode === 410 || err.statusCode === 404)
            stale.push(sub.id);
    })));
    if (stale.length) {
        await prisma_1.prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
    }
}
//# sourceMappingURL=push.service.js.map