import {prisma} from "@/lib/prisma";

export async function GET(){
    try{
        const produtos = await prisma.produto.findMany();

        return Response.json(produtos, {status:200,});
    }
    catch (error){
        console.error("Erro ao buscar o produto:", error);

        return Response.json(
            {
                erro: "Erro ao buscar produtos",
            },
            {
                status:500,
            }
        );
    }
}