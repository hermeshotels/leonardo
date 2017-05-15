import chai from 'chai';
chai.should();
import supertest from 'supertest';
const api = supertest('http://localhost:3000');

const gatewaySlug = '/api/apigateways'

export default describe('Dispo', () => {
  it('should return rooms availabilty', (done) => {
    const uri = `${gatewaySlug}/checkdispo`
    api.get(uri)
      .send({
        ca_id: '138',
        ho_id: '1311',
        ln_id: '2',
        dataArrivo: '20180101',
        dataPartenza: '20180102',
        richiesta: false,
        servizi: false,
        cross: false,
        ENC: 'UTF-8'
      })
      .except(200)
      .then(response => {
        console.log(response)
      })
  })
})
