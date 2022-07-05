/* eslint-disable no-return-await */
export default class ArtistMongoRepository {
  #artist;

  constructor(Artist) {
    this.#artist = Artist;
  }

  async raiseCountOfWorks(artistId) {
    return await this.#artist.findByIdAndUpdate(
      artistId,
      {
        $inc: { countOfWorks: 1 },
      },
      { new: true },
    );
  }

  async reduceCountOfWorks(artistId) {
    return await this.#artist.findByIdAndUpdate(
      artistId,
      {
        $inc: { countOfWorks: -1 },
      },
      { new: true },
    );
  }
}
