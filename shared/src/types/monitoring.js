"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricType = exports.AlertLevel = exports.DeviceStatus = exports.DeviceType = void 0;
var DeviceType;
(function (DeviceType) {
    DeviceType["ROUTER"] = "router";
    DeviceType["SWITCH"] = "switch";
    DeviceType["FIREWALL"] = "firewall";
    DeviceType["ACCESS_POINT"] = "access_point";
    DeviceType["SERVER"] = "server";
    DeviceType["WORKSTATION"] = "workstation";
    DeviceType["PRINTER"] = "printer";
    DeviceType["UNKNOWN"] = "unknown";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["ONLINE"] = "online";
    DeviceStatus["OFFLINE"] = "offline";
    DeviceStatus["WARNING"] = "warning";
    DeviceStatus["CRITICAL"] = "critical";
    DeviceStatus["MAINTENANCE"] = "maintenance";
    DeviceStatus["UNKNOWN"] = "unknown";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
var AlertLevel;
(function (AlertLevel) {
    AlertLevel["INFO"] = "info";
    AlertLevel["WARNING"] = "warning";
    AlertLevel["CRITICAL"] = "critical";
    AlertLevel["EMERGENCY"] = "emergency";
})(AlertLevel || (exports.AlertLevel = AlertLevel = {}));
var MetricType;
(function (MetricType) {
    MetricType["CPU_USAGE"] = "cpu_usage";
    MetricType["MEMORY_USAGE"] = "memory_usage";
    MetricType["DISK_USAGE"] = "disk_usage";
    MetricType["NETWORK_IN"] = "network_in";
    MetricType["NETWORK_OUT"] = "network_out";
    MetricType["BANDWIDTH_USAGE"] = "bandwidth_usage";
    MetricType["LATENCY"] = "latency";
    MetricType["PACKET_LOSS"] = "packet_loss";
    MetricType["TEMPERATURE"] = "temperature";
    MetricType["POWER_CONSUMPTION"] = "power_consumption";
    MetricType["INTERFACE_STATUS"] = "interface_status";
    MetricType["ERROR_RATE"] = "error_rate";
})(MetricType || (exports.MetricType = MetricType = {}));
//# sourceMappingURL=monitoring.js.map