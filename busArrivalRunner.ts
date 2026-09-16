import { createInterface } from 'readline/promises';

const arrivalReq = (stopCode: string) => `https://api.tfl.gov.uk/StopPoint/${stopCode}/Arrivals`

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

export default class tfiRunner {

    async getStopCodeFromUser(): Promise<string> {

        const stopCode = await rl.question('Enter bus stop code: ');
        rl.close();
        return stopCode
    }

    async getBusArrivals(stopCode: string){
        try {
            const response = await fetch(arrivalReq(stopCode))
            const responseJson = await response.json()
            const arrivals = responseJson
                .sort((a: any, b: any) => a.timeToStation - b.timeToStation)
                .slice(0, 5)
                .map((arrival: any) => ({
                    route: arrival.lineName,
                    destination: arrival.destinationName,
                    minutesToArrival: Math.round(arrival.timeToStation / 60)
                }))
            return arrivals
        } catch (error:any) {
            console.error(error)
        } finally {
            console.log("Request successful")
        }
    }

    async run() {
        const stopCode = await this.getStopCodeFromUser();
        const arrivals = await this.getBusArrivals(stopCode);
        console.log(arrivals)
    }

}





