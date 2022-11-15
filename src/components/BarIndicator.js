import styles from './BarIndicator.module.css';

function BarIndicator(props) {
    //props: label, total, values: {color: count}
    const total = props.total;
    const values = props.values;
    let inner_bars = [];
    for(let color in values) {
        inner_bars.push(<div key={color} className={styles.progressBarEntry} style={{backgroundColor: color, flexBasis: values[color]/total*100 + "%"}}>{values[color]}</div>);
    }
    //inner_bars.push(<div key={"filler"} className={styles.progressBarEntry} style={{backgroundColor: "#ddd", flexBasis: "0%"}}></div>);
    return (
        <div className={styles.barIndicator}>
            <div className={styles.label}>{props.label}</div>
            <div className={styles.progressBar}>
                {inner_bars}
            </div>
        </div>
    )
}


function OneBar(props) {
    //props: to_show, colors, names
    return (
        <div className={styles.barIndicator}>
            <div className={styles.label}>{props.label}</div>
            <div className={styles.progressBar}>
                <div className={styles.progressBarEntry} style={{backgroundColor: props.colors[props.to_show], flexBasis: "100%"}}>{props.names[props.to_show]}</div>
            </div>
        </div>
    )
}
export { BarIndicator, OneBar };