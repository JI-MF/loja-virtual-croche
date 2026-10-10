import {randomInt} from "crypto";

export function gerarOTP(){
    const codigo = randomInt(0,1000000);

    return codigo.toString().padStart(6, "0");
}