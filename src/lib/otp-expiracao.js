export function calcularExpiracaoOTP(){
    const agora = new Date();
    return new Date(
        agora.getTime()+5*60*1000
    );
}