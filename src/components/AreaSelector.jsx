function AreaSelector({ areas, selectedAreaId, onSelectArea }) {
  return (
    <section className="area-selector">
      <div>
        <p className="section-kicker">Demo areas</p>
        <h2>Choose a walking area</h2>
        <p>
          Select a sample area to compare a direct route with a shade-following route.
        </p>
      </div>

      <div className="area-buttons">
        {areas.map((area) => (
          <button
            key={area.id}
            className={selectedAreaId === area.id ? "selected" : ""}
            onClick={() => onSelectArea(area.id)}
          >
            {area.name}
          </button>
        ))}
      </div>
    </section>
  );
}

export default AreaSelector;
