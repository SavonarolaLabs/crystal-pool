/** @type {import('./$types').RequestHandler} */
export async function POST({ params }) {
	console.log("api/swap-tx/sign")
	console.log(params)
	return new Response(String("signed"));
}