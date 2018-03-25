"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("./Point");
var AngleUnits;
(function (AngleUnits) {
    AngleUnits[AngleUnits["Radians"] = 1] = "Radians";
    AngleUnits[AngleUnits["Degrees"] = 2] = "Degrees";
})(AngleUnits = exports.AngleUnits || (exports.AngleUnits = {}));
var Matrix = /** @class */ (function () {
    function Matrix(a, b, c, d, e, f) {
        if (a === void 0) { a = 1; }
        if (b === void 0) { b = 0; }
        if (c === void 0) { c = 0; }
        if (d === void 0) { d = 1; }
        if (e === void 0) { e = 0; }
        if (f === void 0) { f = 0; }
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
    }
    Matrix.prototype.isIdentity = function () {
        return this.equals(Matrix.identity);
    };
    Matrix.prototype.isInvertible = function () {
        return !this._q(this.determinant(), 0);
    };
    Matrix.prototype.determinant = function () {
        return this.a * this.d - this.b * this.c;
    };
    Matrix.prototype.equals = function (m) {
        var q = this._q;
        return (q(this.a, m.a) && q(this.b, m.b) &&
            q(this.c, m.c) && q(this.d, m.d) &&
            q(this.e, m.e) && q(this.f, m.f));
    };
    Matrix.prototype.apply = function (pt) {
        return new Point_1.Point(pt.x * this.a + pt.y * this.c + this.e, pt.x * this.b + pt.y * this.d + this.f);
    };
    Matrix.prototype.concat = function (cm) {
        return this.clone().multiply(cm);
    };
    Matrix.prototype.clone = function () {
        return new Matrix().multiply(this);
    };
    Matrix.prototype.transform = function (a2, b2, c2, d2, e2, f2) {
        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;
        var e1 = this.e;
        var f1 = this.f;
        var a = a1 * a2 + c1 * b2;
        var b = b1 * a2 + d1 * b2;
        var c = a1 * c2 + c1 * d2;
        var d = b1 * c2 + d1 * d2;
        var e = a1 * e2 + c1 * f2 + e1;
        var f = b1 * e2 + d1 * f2 + f1;
        return new Matrix(a, b, c, d, e, f);
    };
    ;
    Matrix.prototype.multiply = function (m) {
        return this.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    };
    Matrix.prototype.divide = function (m) {
        if (!m.isInvertible()) {
            throw "Matrix not invertible";
        }
        return this.multiply(m.inverse());
    };
    Matrix.prototype.divideScalar = function (dv) {
        var a = this.a / dv;
        var b = this.b / dv;
        var c = this.c / dv;
        var d = this.d / dv;
        var e = this.e / dv;
        var f = this.f / dv;
        return new Matrix(a, b, c, d, e, f);
    };
    Matrix.prototype.scale = function (f) {
        return this.transform(f, 0, 0, f, 0, 0);
    };
    Matrix.prototype.translate = function (tx, ty) {
        return this.transform(1, 0, 0, 1, tx, ty);
    };
    Matrix.prototype.rotate = function (angle, unit) {
        if (unit === void 0) { unit = AngleUnits.Radians; }
        if (unit === AngleUnits.Degrees) {
            return this.rotate(angle * Math.PI / 180);
        }
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        return this.transform(cos, sin, -sin, cos, 0, 0);
    };
    Matrix.prototype.inverse = function () {
        var dt = this.determinant();
        if (this._q(dt, 0)) {
            throw "Matrix not invertible.";
        }
        var a = this.d / dt;
        var b = -this.b / dt;
        var c = -this.c / dt;
        var d = this.a / dt;
        var e = (this.c * this.f - this.d * this.e) / dt;
        var f = -(this.a * this.f - this.b * this.e) / dt;
        return new Matrix(a, b, c, d, e, f);
    };
    Matrix.prototype.toArray = function () {
        return [this.a, this.b, this.c, this.d, this.e, this.f];
    };
    Matrix.prototype.toCSS = function () {
        return "matrix(" + this.toArray() + ")";
    };
    Matrix.prototype.toCSS3D = function () {
        return "matrix3d(" + this.a + ", " + this.b + ", 0, 0, " + this.c + ", " + this.d + ", 0, 0, 0, 0, 1, 0, " + this.e + ", " + this.f + ", 0, 1)";
    };
    Matrix.prototype._q = function (f1, f2) {
        return Math.abs(f1 - f2) < 1e-14;
    };
    Matrix.identity = new Matrix();
    return Matrix;
}());
exports.Matrix = Matrix;
//# sourceMappingURL=Matrix.js.map