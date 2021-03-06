const express = require("express")
const elastic = require("elasticsearch")
const movies = require("./movies.json")

const app = express()

app.use(express.json())

const esClient = elastic.Client({
    host: "http://127.0.0.1:9200",
})

app.get("/", (req, res) => {

    res.json({ movie: movies[0].title })
})

//Creating the movies index 
app.post("/movies", (req, res) => {
    esClient.index({
        index: "movies",
        body: {},

    }).then(response => {
        res.json({ message: "Movies index added succefully" })
    }).catch(err => { console.log(err) })

})

//Populating the movies index with the dummy movies data
app.post("/movies/populate", async (req, res) => {
    const body = movies.flatMap(doc => [{ index: { _index: "movies" } }, doc])
    try {
        const bulkResponse = await esClient.bulk({ refresh: true, body })
        console.log(bulkResponse)
    } catch (err) {
        console.log(err)
    }
    const count = await esClient.count({ index: "movies" })
    console.log(count)
    res.json({ count: count })
})


//Fuzzy search to look for results "similar" to the search terms 
app.get("/movies/search", (req, res) => {
    const searchTerms = req.body.searchTerms
    esClient.search({
        index: "movies",
        body: {
            query: {
                fuzzy: {
                    title: {
                        value: searchTerms,
                        fuzziness: "AUTO",
                        transpositions: true,

                    }
                }
            }
        }
    }).then(response => {
        res.json({ response })
    }).catch(err => {
        res.json({ error: `error:${err}` })
        console.log(err)
    })
})



app.listen(4000, () => {
    console.log("Server Running On port 4000...")
})