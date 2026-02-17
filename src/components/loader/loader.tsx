import "../../app/globals.css"
const loader = () => {
    return (
        <div className="loader-container">
            <div className="three-body">
                <div className="three-body__dot"></div>
                <div className="three-body__dot"></div>
                <div className="three-body__dot"></div>
            </div>
        </div>
    )
}

export default loader
