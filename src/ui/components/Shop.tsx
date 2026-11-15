import type { GameState, UpgradeId } from '../../game/types';
import { canBuyUpgrade, nextUpgradeCost } from '../../game/upgrades';
import { useContent } from '../ContentContext';
import { formatMoney } from '../format';

interface ShopProps {
  state: GameState;
  onBuy: (upgrade: UpgradeId) => void;
}

export function Shop({ state, onBuy }: ShopProps) {
  const { ui, locale } = useContent();
  const cost = nextUpgradeCost(state, 'cord');

  return (
    <section className="shop" aria-labelledby="shop-title">
      <h2 id="shop-title">{ui.shopTitle}</h2>
      <ul>
        <li className="shop__item">
          <div>
            <h3>{ui.upgradeCordName}</h3>
            <p>{ui.upgradeCordDescription}</p>
          </div>
          {cost === null ? (
            <p className="shop__sold-out">{ui.soldOut}</p>
          ) : (
            <button
              type="button"
              className="button"
              disabled={!canBuyUpgrade(state, 'cord')}
              onClick={() => {
                onBuy('cord');
              }}
            >
              {ui.buyFor(formatMoney(cost, locale))}
            </button>
          )}
        </li>
      </ul>
    </section>
  );
}
