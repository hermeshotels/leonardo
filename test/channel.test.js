import chai from 'chai';
chai.should();
import supertest from 'supertest';
const api = supertest('http://localhost:3000');

const gatewaySlug = '/api/apigateways'

export default describe('Channel', () => {
  it('should return the test hotel channel info and the test hotel info', (done) => {
    const uri = `${gatewaySlug}/channel?channel=138`
    api.get(uri)
      .expect(200)
      .then(response => {
        response.body.channel.id.should.equal('138')
        response.body.channel.name.should.equal('HOTEL CHIMERA')
        response.body.channel.hotels.should.be.instanceof(Array)
        response.body.channel.hotels[0].name.should.equal('THIS IS JUST A TEST HOTEL')
        done()
      })
  })
  it('should not return any channel and error 404', () => {
    const uri = `${gatewaySlug}/channel?channel=8877`
    api.get(uri)
      .expect(404)
  })
})
