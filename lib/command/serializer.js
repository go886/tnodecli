const util = require('../util/util')
const zlib = require('zlib');

let i = 0;
const t_map = i++;
const t_list = i++;
const t_string = i++;
const t_mstring = i++;
const t_lstring = i++;
const t_float = i++;
const t_double = i++;
const t_bool = i++;
const t_uint8 = i++;
const t_uint16 = i++;
const t_uint32 = i++;
const t_uint64 = i++;
const t_ref = i++;
const t_mref = i++;
const t_firstref = i++;
const t_ref1 = i++;
const t_ref2 = i++;
const t_ref3 = i++;
const t_ref4 = i++;
const t_ref5 = i++;
const t_ref6 = i++;
const t_ref7 = i++;
const t_ref8 = i++;
const t_ref9 = i++;





const VERSION = 0;
const TAG = 't'.charCodeAt(0);
module.exports = {
    encode(info, compress = false) {
        let buffer = Buffer.alloc(1024 * 1024);
        let stack = []
        let list = []
        let indexsMap = {}
        let que = [info];
        let size = 0;
        let flag = 0;
        let index = -1;
        let tmp;

        while (que.length > 0) {
            tmp = que.pop();
            stack.push(tmp)
            if (Array.isArray(tmp)) {
                let k = tmp.length;
                while (k--) {
                    que.push(tmp[k])
                }
            } else if (util.isObject(tmp)) {
                let keys = Object.keys(tmp).reverse();
                keys.forEach(k => {
                    que.push(k)
                })
                keys.forEach(k => {
                    // que.push(k);
                    que.push(tmp[k]);
                });
            } else if (util.isString(tmp)) {
                if (indexsMap[tmp] !== undefined) {
                    indexsMap[tmp]++
                } else {
                    indexsMap[tmp] = 0;
                }
            } else {

            }
        }

        list = Object.keys(indexsMap).sort((a, b) => {
            return indexsMap[b] - indexsMap[a];
        }).filter((v) => {
            return indexsMap[v] > 0;
        });

        let maxLength = 0;
        let byteslist = list.map(v => {
            let buf = Buffer.from(v, 'utf8')
            if (buf.length > maxLength) maxLength = buf.length;
            return buf;
        })

        flag = maxLength > 0xFF ? 1 : 0;
        size = buffer.writeUInt16LE(byteslist.length, size);
        byteslist.forEach((buf, i) => {
            size = flag == 1 ? buffer.writeUInt16LE(buf.length, size) :
                                 buffer.writeUInt8(buf.length, size)
            size += buf.copy(buffer, size)
        });


        function getType(v) {
            if (Array.isArray(v))
                return t_list;
            else if (util.isObject(v))
                return t_map;
            else {
                index = list.indexOf(v)
                if (-1 !== index) {
                    if (0 == index)
                        return t_firstref;
                    else if (1 == index)
                        return t_ref1
                    else if (2 == index)
                        return t_ref2
                    else if (3 == index)
                        return t_ref3
                    else if (4 == index)
                        return t_ref4
                    else if (5 == index)
                        return t_ref5
                    else if (6 == index)
                        return t_ref6
                    else if (7 == index)
                        return t_ref7
                    else if (8 == index)
                        return t_ref8
                    else if (9 == index)
                        return t_ref9
                    else if (index <= 0xFF)
                        return t_mref;
                    else
                        return t_ref;
                } else {
                    if (util.isString(v)) {
                        const buf = Buffer.from(v);
                        if (buf.length <= 0xFF) {
                            return t_string;
                        } else if (buf.length <= 0xFFFF) {
                            return t_mstring;
                        } else {
                            return t_lstring;
                        }
                    } else if (util.isFloat(v)) {
                        return t_double
                    } else if (util.isBoolean(v)) {
                        return t_bool;
                    } else if (util.isInteger(v)) {
                        if (v <= 0xFF)
                            return t_uint8
                        else if (v <= 0xFFFF)
                            return t_uint16
                        else if (v < 0xFFFFFFFF)
                            return t_uint32
                        else
                            return t_uint64
                    } else {
                        console.error(tmp);
                        throw 'type error';
                    }
                }
            }
        }

        function doencode(type, v) {
            switch (type) {
                case t_map: {
                    buffer.writeUInt16LE(Object.keys(v).length, size);
                    size += 2;
                }
                    break;
                case t_list: {
                    buffer.writeUInt16LE(v.length, size);
                    size += 2;
                }
                    break;
                case t_string: {
                    const buf = Buffer.from(v);
                    buffer.writeUInt8(buf.length, size++)
                    if (buf.length > 0) {
                        size += buf.copy(buffer, size, 0, buf.length)
                    }
                }
                    break;
                case t_mstring: {
                    const buf = Buffer.from(v);
                    buffer.writeUInt16LE(buf.length, size)
                    size += 2;
                    if (buf.length > 0) {
                        size += buf.copy(buffer, size, 0, buf.length)
                    }
                }
                    break;
                case t_lstring: {
                    const buf = Buffer.from(v);
                    buffer.writeUInt32LE(buf.length, size)
                    size += 4;
                    if (buf.length > 0) {
                        size += buf.copy(buffer, size, 0, buf.length)
                    }
                }
                    break;
                case t_float: {
                    size = buffer.writeDoubleLE(v, size)
                }
                    break;
                case t_double: {
                    size = buffer.writeDoubleLE(v, size)
                }
                    break;
                case t_bool: {
                    buffer.writeUInt8(v, size++)
                } break;
                case t_uint8: {
                    buffer.writeUInt8(v, size++);
                } break;
                case t_uint16: {
                    size = buffer.writeUInt16LE(v, size);
                    
                } break;
                case t_uint32: {
                    size =buffer.writeUInt32LE(v, size);
                } break;
                case t_uint64: {
                    const MAX_UINT32 = 0xFFFFFFFF
                    // write
                    const big = ~~(v / MAX_UINT32)
                    const low = (v % MAX_UINT32) - big
                    buffer.writeUInt32LE(low, size)  // 00 00 01 53 36 9a 06 58
                    size += 4;
                    buffer.writeUInt32LE(big, size)  // 00 00 01 53 00 00 00 00
                    size += 4;
                } break;
                case t_ref: {
                    buffer.writeUInt16LE(list.indexOf(v), size);
                    size += 2;
                } break;
                case t_mref: {
                    buffer.writeUInt8(list.indexOf(v), size++);
                } break;
                case t_firstref: { } break;
                case t_ref1: { } break;
                case t_ref2: { } break;
                case t_ref3: { } break;
                case t_ref4: { } break;
                case t_ref5: { } break;
                case t_ref6: { } break;
                case t_ref7: { } break;
                case t_ref8: { } break;
                case t_ref9: { } break;
                default:{
                    console.error('err type', type)
                } break;
            }
        }


        while (stack.length > 0) {
            let count = stack.length;
            let repeatlist = []
            while (count--) {
                tmp = stack[count];
                if (repeatlist.length == 0) {
                    repeatlist.push(tmp)
                } else if (getType(tmp) == getType(repeatlist[0])) {
                    repeatlist.push(tmp);
                } else {
                    break;
                }
            }
            stack.splice(stack.length - repeatlist.length, repeatlist.length);
            let type = getType(repeatlist[0])
            if (repeatlist.length > 2 && repeatlist.length <= 0xFF) {
                buffer.writeUInt8(0xFF, size++)
                buffer.writeUInt8(type, size++)
                buffer.writeUInt8(repeatlist.length, size++)
                repeatlist.forEach(v => {
                    doencode(type, v);
                });
            } else {
                repeatlist.forEach(v => {
                    buffer.writeUInt8(type, size++)
                    doencode(type, v);
                });
            }
            continue;




            if (Array.isArray(tmp)) {
                buffer.writeUInt8(t_list, size++);
                buffer.writeInt16LE(tmp.length, size);
                size += 2;
            } else if (util.isObject(tmp)) {
                buffer.writeUInt8(t_map, size++)
                buffer.writeInt16LE(Object.keys(tmp).length, size);
                size += 2;
            } else {
                index = list.indexOf(tmp);
                if (-1 == index) {
                    if (util.isString(tmp)) {
                        const buf = Buffer.from(tmp);
                        if (buf.length <= 0xFF) {
                            buffer.writeUInt8(t_string, size++)
                            buffer.writeUInt8(buf.length, size++)
                        } else if (buf.length <= 0xFFFF) {
                            buffer.writeUInt8(t_mstring, size++);
                            buffer.writeUInt16LE(buf.length, size);
                            size += 2;
                        } else {
                            buffer.writeUInt8(t_lstring, size++);
                            buffer.writeUInt32LE(buf.length, size);
                            size += 4;
                        }

                        if (buf.length > 0) {
                            size += buf.copy(buffer, size, 0, buf.length)
                            // list.push(tmp)
                        }
                    } else if (util.isFloat(tmp)) { //js 本身对float 支持不友好
                        buffer.writeUInt8(t_double, size++)
                        //  size+= buffer.writeFloatLE(tmp, size);
                        size = buffer.writeDoubleLE(tmp, size)
                    } else if (util.isBoolean(tmp)) {
                        buffer.writeUInt8(t_bool, size++)
                        buffer.writeUInt8(tmp, size++)
                    } else if (util.isInteger(tmp)) {
                        if (tmp <= 255) {
                            buffer.writeUInt8(t_uint8, size++);
                            buffer.writeUInt8(tmp, size++);
                        } else if (tmp <= 65535) {
                            buffer.writeUInt8(t_uint16, size++);
                            buffer.writeUInt16LE(tmp, size);
                            size += 2;
                        } else if (tmp <= 4294967295) {
                            buffer.writeUInt8(t_uint32, size++);
                            buffer.writeUInt32LE(tmp, size);
                            size += 4;
                        } else {
                            buffer.writeUInt8(t_uint64, size++);
                            const MAX_UINT32 = 0xFFFFFFFF

                            // write
                            const big = ~~(tmp / MAX_UINT32)
                            const low = (tmp % MAX_UINT32) - big
                            buffer.writeUInt32LE(low, size)  // 00 00 01 53 36 9a 06 58
                            size += 4;
                            buffer.writeUInt32LE(big, size)  // 00 00 01 53 00 00 00 00

                            size += 4;
                        }

                    } else {
                        console.error(tmp);
                        throw 'type error';
                    }
                } else {
                    if (index == 0) {
                        buffer.writeUInt8(t_firstref, size++);
                    } else if (index == 1) {
                        buffer.writeUInt8(t_ref1, size++);
                    } else if (index == 2) {
                        buffer.writeUInt8(t_ref2, size++);
                    } else if (index == 3) {
                        buffer.writeUInt8(t_ref3, size++);
                    } else if (index == 4) {
                        buffer.writeUInt8(t_ref4, size++);
                    } else if (index == 5) {
                        buffer.writeUInt8(t_ref5, size++);
                    } else if (index == 6) {
                        buffer.writeUInt8(t_ref6, size++);
                    } else if (index == 7) {
                        buffer.writeUInt8(t_ref7, size++);
                    } else if (index == 8) {
                        buffer.writeUInt8(t_ref8, size++);
                    } else if (index == 9) {
                        buffer.writeUInt8(t_ref9, size++);
                    } else if (index <= 255) {
                        buffer.writeUInt8(t_mref, size++);
                        buffer.writeUInt8(index, size++);
                    } else {
                        buffer.writeUInt8(t_ref, size++);
                        buffer.writeUInt16LE(index, size);
                        size += 2;
                    }
                }
            }
        }

        const packetsize = size;
        let packet = null;
        if (compress == true) {
            packet = zlib.gzipSync(buffer.slice(0, packetsize));
        } else {
            packet = Buffer.alloc(packetsize);
            buffer.copy(packet, 0, 0, packetsize)
        }

        size = 0;
        buffer.writeUInt8(TAG, size++)
        buffer.writeUInt8(VERSION, size++);
        buffer.writeUInt8(compress, size++);
        buffer.writeUInt8(flag, size++); //reserve
        buffer.writeUInt32LE(packetsize, size);
        size += 4;
        packet.copy(buffer, size)

        return buffer.slice(0, size + packet.length);
    },
    decode(buffer) {
        let offset = 0;
        let t;
        let v;
        let compress = false;
        let flag;
        let packetsize;
        {
            t = buffer.readUInt8(offset++)
            v = buffer.readUInt8(offset++)
            compress = buffer.readUInt8(offset++)
            flag = buffer.readUInt8(offset++)
            packetsize = buffer.readUInt32LE(offset); offset += 4;
            if (t != TAG || v != VERSION) {
                return null;
            }

            if (compress == true) {
                buffer = zlib.unzipSync(buffer.slice(offset))
                offset = 0;
            }

            if (buffer.length - offset != packetsize) {
                return null;
            }
        }

        let list = []
        let que = []
        let type;
        {
            let count = buffer.readUInt16LE(offset); offset += 2;
            let len;
            while (count--) {
                if (flag === 1) {
                    len = buffer.readUInt16LE(offset);
                    offset += 2;
                } else {
                    len = buffer.readUInt8(offset++);
                }
                if (len > 0) {
                    let string = buffer.toString('utf8', offset, offset + len);
                    list.push(string);
                    offset += len;
                } else {
                    list.push("");
                }
            }
        }
        while (offset < buffer.length) {
            type = buffer.readUInt8(offset++);
            switch (type) {
                case t_map: {
                    let map = {}
                    let k = buffer.readUInt16LE(offset); offset += 2;
                    while (k--) {
                        const value = que.pop()
                        const key = que.pop()
                        map[key] = value
                    }
                    que.push(map)
                }
                    break;
                case t_list: {
                    let cnt = buffer.readUInt16LE(offset); offset += 2;
                    let list = []
                    while (cnt--) {
                        list.push(que.pop())
                    }
                    que.push(list);
                }
                    break;
                case t_string: {
                    let cnt = buffer.readUInt8(offset++);
                    let string = buffer.toString('utf8', offset, offset + cnt); offset += cnt;
                    if (cnt > 0) {
                        // list.push(string);
                    }
                    que.push(string);
                }
                    break;
                case t_mstring: {
                    let cnt = buffer.readUInt16LE(offset); offset += 2;
                    let string = buffer.toString('utf8', offset, offset + cnt); offset += cnt;
                    if (cnt > 0) {
                        // list.push(string);
                    }
                    que.push(string);
                }
                    break;
                case t_lstring: {
                    let cnt = buffer.readUInt32LE(offset); offset += 4;
                    let string = buffer.toString('utf8', offset, offset + cnt); offset += cnt;
                    if (cnt > 0) {
                        // list.push(string);
                    }
                    que.push(string);
                }
                    break;
                case t_float: {
                    let f = buffer.readFloatLE(offset); offset += 4;
                    que.push(Number(f.toPrecision(7)));
                }
                    break;
                case t_double: {
                    let f = buffer.readDoubleLE(offset); offset += 8;
                    que.push(f);
                }
                    break;
                case t_bool: {
                    let f = buffer.readUInt8(offset++);
                    que.push(!!f);
                }
                    break;
                case t_uint8: {
                    let f = buffer.readUInt8(offset++);
                    que.push(f);
                }
                    break;
                case t_uint16: {
                    let f = buffer.readUInt16LE(offset); offset += 2;
                    que.push(f);
                }
                    break;
                case t_uint32: {
                    let f = buffer.readUInt32LE(offset); offset += 4;
                    que.push(f);
                }
                    break;
                case t_uint64: {
                    const low = buffer.readUInt32LE(offset); offset += 4;
                    const big = buffer.readUInt32LE(offset); offset += 4;
                    function toDouble(high, low, signed) {
                        const MAX_UINT32 = 0x00000000FFFFFFFF
                        if (signed && (high & 0x80000000) !== 0) {
                            high = onesComplement(high)
                            low = onesComplement(low)
                            console.assert(high < 0x00200000, "number too small")
                            return -((high * (MAX_UINT32 + 1)) + low + 1)
                        }
                        else { //positive
                            console.assert(high < 0x00200000, "number too large")
                            return (high * (MAX_UINT32 + 1)) + low
                        }
                    }
                    const f = toDouble(big, low, false)
                    que.push(f);
                }
                    break;
                case t_ref: {
                    let index = buffer.readUInt16LE(offset); offset += 2;
                    que.push(list[index]);
                }
                    break;
                case t_mref: {
                    let index = buffer.readUInt8(offset++);
                    que.push(list[index]);
                }
                    break;
                case t_firstref: {
                    que.push(list[0])
                }
                    break;
                case t_ref1: {
                    que.push(list[1])
                }
                    break;
                case t_ref2: {
                    que.push(list[2])
                }
                    break;
                case t_ref3: {
                    que.push(list[3])
                }
                    break;
                case t_ref4: {
                    que.push(list[4])
                }
                    break;
                case t_ref5: {
                    que.push(list[5])
                }
                    break;
                case t_ref6: {
                    que.push(list[6])
                }
                    break;
                case t_ref7: {
                    que.push(list[7])
                }
                    break;
                case t_ref8: {
                    que.push(list[8])
                }
                    break;
                case t_ref9: {
                    que.push(list[9])
                }
                    break;
                default: {
                    throw 'err type:' + String.fromCharCode(type);
                    break;
                }
            }
        }
        return que[0];
    },
    safe_encode(info, compress) {
        // info = {
        //     "title":"title-value",
        //     "list":[1,3,9,10,2,0],
        //     "info":{
        //         a:'a-value',
        //         b:'b-value'
        //     }
        // }
        if (util.isString(info)) {
            info = JSON.parse(info)
        }
        const data = this.encode(info, compress)
        // const out = this.decode(data)
        // const outstring = JSON.stringify(out);
        // const inputstring = JSON.stringify(info);
        // if (outstring != inputstring) {
        //     console.warn('binary-dsl is diffrent...')
        //     throw 'diffrent'
        // } else {
        // }
        return data;
    }
}