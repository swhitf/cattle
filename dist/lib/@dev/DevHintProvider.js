"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Names = ["Mic Hearnshaw", "Rudie Bennetts", "Waneta Geindre", "Dana Ollivierre", "Wash Powney", "Thaxter Perrygo", "Lelah Goffe", "Aldin Mendonca", "Westley Tomkowicz", "Boony Linkie", "Anitra O'Kennavain", "Penni Sorrie", "Joela Challenor", "Ileana Faye", "Karel Mar", "Aldous Kohlert", "Griswold Grishaev", "Moshe Switsur", "Gayleen Maylour", "Ingeberg Berecloth", "Ailsun Gerardin", "Lorelei Stitson", "Lark Whiskerd", "Cliff Graham", "Dermot Faber", "Gerti Holburn", "Scarlet Garnall", "Kristy Benfell", "Denni Kingstne", "Traver Riseley", "Micah Drohun", "Wendy Ramiro", "Lavena Goodread", "Marys Tarquinio", "Ashbey Elger", "Griff Worland", "Rourke Janc", "Pietro Fomichkin", "Elisabeth Rickword", "Claresta Lawden", "Babette Bruckner", "Leilah Overthrow", "Rabi Orme", "Blaire Kloska", "Zebadiah Ianiello", "Sashenka Mattiello", "Rhetta Brownsea", "Wendi Menlove", "Pia Bodicam", "Junia Temlett"];
var DevHintProvider = /** @class */ (function () {
    function DevHintProvider() {
    }
    DevHintProvider.prototype.suggest = function (cell, input) {
        if (cell.colRef > 5 && cell.rowRef > 5)
            return null;
        var candidates = Names
            .filter(function (x) { return x.toLowerCase().startsWith(input.toLowerCase()); })
            .sort();
        return candidates[0] || null;
    };
    return DevHintProvider;
}());
exports.DevHintProvider = DevHintProvider;
//# sourceMappingURL=DevHintProvider.js.map