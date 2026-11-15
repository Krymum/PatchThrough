import type { GameState, UpgradeId } from '../../game/types';
import { PLOTS, plotHoldingUpgrade } from '../../game/story';
import { availableUpgrades, canBuyUpgrade, nextUpgradeCost } from '../../game/upgrades';
import { useContent } from '../ContentContext';
import { formatMoney } from '../format';

interface ShopProps {
  state: GameState;
  onBuy: (upgrade: UpgradeId) => void;
}

export function Shop({ state, onBuy }: ShopProps) {
  const { ui, upgrades, districts, locale } = useContent();
  const offers = availableUpgrades(state);
  if (offers.length === 0) return null;

  return (
    <section className="shop" aria-labelledby="shop-title">
      <h2 id="shop-title">{ui.shopTitle}</h2>
      <ul className="shop__list">
        {offers.map((id) => {
          const cost = nextUpgradeCost(state, id) ?? 0;
          const heldBy = plotHoldingUpgrade(state, id);
          return (
            <li key={id} className="shop__item">
              <div>
                <h3>{upgrades[id].name}</h3>
                <p>{upgrades[id].description}</p>
                {heldBy && (
                  <p className="shop__held">{ui.storyHeld(districts[PLOTS[heldBy].district])}</p>
                )}
              </div>
              <button
                type="button"
                className="button"
                disabled={!canBuyUpgrade(state, id)}
                onClick={() => {
                  onBuy(id);
                }}
              >
                {ui.buyFor(formatMoney(cost, locale))}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
