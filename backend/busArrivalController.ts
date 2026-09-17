import { Router, Request, Response } from 'express';
import TfiRunner from "./busArrivalRunner";

const runner = new TfiRunner();

class busController {
    router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/arrivals/:postcode', this.getArrivalsFromPostcode.bind(this));
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
}

export default new busController().router;