import { createInterface } from 'readline/promises';

const arrivalReq = (stopCode: string) => `https://api.tfl.gov.uk/StopPoint/${stopCode}/Arrivals`
const postcodeLocationReq = (postcode: string) => `https://api.postcodes.io/postcodes/${postcode}`
const stopPointsNearbyReq = (lat: number, lon: number, radius: number) => `https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=NaptanPublicBusCoachTram&radius=${radius}`

const SEARCH_RADIUS = 500

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

    async getPostcodeFromUser(): Promise<string> {

        const postCode = await rl.question('Enter postcode: ');
        rl.close();
        return postCode
    }

    async getPostcodeLocation(postCode: string) {
        try {
            const response = await fetch(postcodeLocationReq(postCode))
            const responseJson = await response.json()
            const { latitude, longitude } = responseJson.result
            return { latitude, longitude }

        } catch (error:any) {
            console.error(error)
        } finally {
            console.log("Postcode request successful")
        }
    }

    async getStopPointsNearby(latitude: number, longitude: number) {
        try {
            const response = await fetch(stopPointsNearbyReq(latitude, longitude, SEARCH_RADIUS))
            const responseJson = await response.json()
            const stopPoints = responseJson.stopPoints
                .map((stopPoint: any) => ({
                    id: stopPoint.id,
                    commonName: stopPoint.commonName
                }))
            return stopPoints

        } catch (error:any) {
            console.error(error)
        } finally {
            console.log("Stop points request successful")
        }
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
                    stationName : arrival.stationName,
                    platformName : arrival.platformName === "null" ? null : arrival.platformName,
                    destination: arrival.destinationName,
                    minutesToArrival: Math.round(arrival.timeToStation / 60)
                }))
            return arrivals
        } catch (error:any) {
            console.error(error)
        } finally {
            console.log("Arrival request successful")
        }
    }

    async run() {
        const postCode = await this.getPostcodeFromUser();
        const location = await this.getPostcodeLocation(postCode);
        const stopPoints = await this.getStopPointsNearby(location?.latitude, location?.longitude);
        
        const arrivalsPerStop = await Promise.all(
            stopPoints.map((stopPoint: any) => this.getBusArrivals(stopPoint.id))
        );

    console.log(arrivalsPerStop);
    }

    async runApi(postCode: string) {
        const location = await this.getPostcodeLocation(postCode);
        const stopPoints = await this.getStopPointsNearby(location?.latitude, location?.longitude);
        
        const arrivalsPerStop = await Promise.all(
            stopPoints.map((stopPoint: any) => this.getBusArrivals(stopPoint.id))
        );
        
        return arrivalsPerStop;


    }

}





