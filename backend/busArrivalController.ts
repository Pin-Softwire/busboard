import { Router, Request, Response } from 'express';
import TfiRunner from "./busArrivalRunner";

const runner = new TfiRunner();

class busController {
    router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/arrivals/:postcode', this.getArrivalsFromPostcode.bind(this));
        this.router.get('/arrivals', this.getArrivalsFromLonLat.bind(this));
        this.router.get('/location/:postcode', this.getLocationFromPostcode.bind(this));
    }

    async getLocationFromPostcode(req: Request, res: Response): Promise<Response> {
        try {
            const postCode = String(req.params.postcode);
            const location = await runner.getPostcodeLocation(postCode);
            return res.status(200).json(location);
        } catch (err) {
            return res.status(500).json({
                error: 'Failed to fetch postcode location'
            })
        }
    }

    async getArrivalsFromPostcode(req: Request, res: Response): Promise<Response> {
        try {
            const postCode = String(req.params.postcode);
            const arrivals = await runner.runApi(postCode);
            return res.status(200).json(arrivals);
        } catch (err) {
            return res.status(500).json({
                error: 'Failed to fetch bus arrivals'
            })

        }
    }

    async getArrivalsFromLonLat(req: Request, res: Response): Promise<Response> {
        try {
            const lat = Number(String(req.query.lat))
            const lon = Number(String(req.query.lon));
            const arrivals = await runner.runApiLatLon(lat, lon);
            return res.status(200).json(arrivals);
        } catch (err) {
            return res.status(500).json({
                error: 'Failed to fetch bus arrivals'
            })

        }
    }
}

export default new busController().router;