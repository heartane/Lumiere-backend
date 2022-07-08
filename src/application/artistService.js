import serviceLocator from '../infrastructure/config/serviceLocator';

class ArtistService {
  constructor(artistRepository) {
    this.artistRepository = artistRepository;
  }
}

const artistRepositoryInstance = serviceLocator.artistRepository;
const artistService = new ArtistService(artistRepositoryInstance);

export default artistService;
