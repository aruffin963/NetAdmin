"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubnetType = exports.PoolType = exports.IpStatus = void 0;
var IpStatus;
(function (IpStatus) {
    IpStatus["AVAILABLE"] = "available";
    IpStatus["ALLOCATED"] = "allocated";
    IpStatus["RESERVED"] = "reserved";
    IpStatus["BLOCKED"] = "blocked";
})(IpStatus || (exports.IpStatus = IpStatus = {}));
var PoolType;
(function (PoolType) {
    PoolType["PUBLIC"] = "public";
    PoolType["PRIVATE"] = "private";
    PoolType["MANAGEMENT"] = "management";
    PoolType["DMZ"] = "dmz";
})(PoolType || (exports.PoolType = PoolType = {}));
var SubnetType;
(function (SubnetType) {
    SubnetType["LAN"] = "lan";
    SubnetType["WAN"] = "wan";
    SubnetType["VLAN"] = "vlan";
    SubnetType["MANAGEMENT"] = "management";
    SubnetType["GUEST"] = "guest";
})(SubnetType || (exports.SubnetType = SubnetType = {}));
//# sourceMappingURL=ip.js.map