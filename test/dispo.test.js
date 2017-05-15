import chai from 'chai';
chai.should();
import supertest from 'supertest';
const api = supertest('http://localhost:3000');

const gatewaySlug = '/api/apigateways'

export default describe('Dispo', () => {
  it('should return rooms availabilty', (done) => {
    const uri = `${gatewaySlug}/checkdispo`
    api.post(uri)
      .send({
        "hotel": "1311",
        "channel": "138",
        "language": "2",
        "arrival": "20171201",
        "departure": "20171202",
        "rooms": [
          {
            "adults": 2,
            "childs": 0,
            "childsAge": [],
            "rate": null,
            "roomData": null
          }
        ],
        "promocode": ""
      })
      .expect(200)
      .then(response => {
        response.body.dispo.rooms.should.be.instanceof(Array)
        response.body.dispo.services.should.be.instanceof(Array)
        if (response.body.dispo.rooms.length > 0) {
          response.body.dispo.rooms[0].should.include.keys('id')
          response.body.dispo.rooms[0].should.include.keys('name')
          response.body.dispo.rooms[0].rates.should.be.instanceof(Array)
          response.body.dispo.rooms[0].rates[0].should.include.keys('id')
          response.body.dispo.rooms[0].rates[0].should.include.keys('name')
        }
        done()
      })
  })
  it('should return a discount value', (done) => {
    const uri = `${gatewaySlug}/checkdispo`
    api.post(uri)
      .send({
        "hotel": "1311",
        "channel": "138",
        "language": "2",
        "arrival": "20171201",
        "departure": "20171202",
        "rooms": [
          {
            "adults": 2,
            "childs": 0,
            "childsAge": [],
            "rate": null,
            "roomData": null
          }
        ],
        "promocode": "PLUTO"
      })
      .expect(200)
      .then(response => {
        response.body.dispo.rooms.should.be.instanceof(Array)
        response.body.dispo.rooms[0].rates[0].should.be.instanceof(Array)
        done()
      })
  })
})
